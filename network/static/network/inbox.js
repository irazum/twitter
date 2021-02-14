
function auto_grow(event) {
    element = event.target
    element.style.height = "5px";
    element.style.height = `${element.scrollHeight}px`;
}


document.addEventListener("DOMContentLoaded", () => {

    // all-post nav button click handler
    document.querySelector('#all-posts').removeAttribute('href');
    document.querySelector('#all-posts').addEventListener("click", () => {

        if (document.querySelector('#tweet-field').dataset.is_auth) {
            document.querySelector("#tweet-field").style.display = 'block';
        } else { document.querySelector("#tweet-field").style.display = 'none'; }

        document.querySelector('#profile').style.display = 'none';
        load_tweets('allPosts');
    });

    // tweet-from handler
    document.querySelector('#tweet-form > textarea').oninput = auto_grow;
    document.querySelector('#tweet-form').onsubmit = submit_tweet_handler;

    // following nav button click handler
    if (document.querySelector('#following')) {
        document.querySelector('#following').addEventListener("click", () => {
            document.querySelector("#tweet-field").style.display = 'block';
            document.querySelector('#profile').style.display = 'none';
            load_tweets('following');
        });
    }

    // load tweets for home page (all twits)
    if (document.querySelector('#tweet-field').dataset.is_auth) {
        document.querySelector("#tweet-field").style.display = 'block';
    } else { document.querySelector("#tweet-field").style.display = 'none'; }

    document.querySelector('#profile').style.display = 'none';
    load_tweets("allPosts");


});


function load_tweets(type) {
/*
Функция делает асинхронный запрос на "/tweets" , передавая доп. параметры в строке запроса
type == following or all_posts. После сериализует json-ответ, создаёт в цикле grid-item на его основе.
*/
    fetch(`/tweets?type=${type}`)
    .then(response => response.json())
    .then(tweets => {
        /* drop old tweet grid-items */
        items = document.querySelector(".grid-container").children;
        // transform nodeList in Array
        items = Array.from(items);
        items = items.slice(2, items.length);
        items.forEach(item => {
            item.remove();
        });
        tweets.forEach(tweet => {
            /* create new tweet grid-item */
            let grid_item = create_tweet_element(tweet);
            document.querySelector(".grid-container").append(grid_item);
        });
    })
}


function create_tweet_element(tweet) {
    // main element
    let grid_item = document.createElement('div');
    grid_item.className = "grid-item tweet-container";
    grid_item.dataset.id = tweet.id

    // elements in grid item
    let from_info = document.createElement('div');
    from_info.className = "from-info";
    grid_item.appendChild(from_info);

    let tweet_text = document.createElement('div');
    tweet_text.className = 'tweet';
    tweet_text.innerHTML = tweet.text;
    grid_item.appendChild(tweet_text);

    let tweet_buttons = document.createElement('div');
    tweet_buttons.className = 'tweet-buttons';
    grid_item.appendChild(tweet_buttons);

    // elements in from_info
    let prof_link = document.createElement('a');
    prof_link.className = 'profile-link';
    prof_link.setAttribute('data-id', tweet.user_id)
    prof_link.innerHTML = tweet.username;

    prof_link.addEventListener('click', profile_link_handler);

    from_info.appendChild(prof_link);


    let timestamp = document.createElement('span');
    timestamp.innerHTML = tweet.timestamp;
    from_info.appendChild(timestamp);

    // elements in tweet_buttons

    let button = document.createElement('а');
    //button.innerHTML = 'Edit';
    button.className = 'edit-button';

    tweet_buttons.appendChild(button);



    button = document.createElement('a');
    button.innerHTML = 'comm';
    tweet_buttons.appendChild(button);


    button = document.createElement('a');
    button.className = 'like-btn';
    if (tweet.like === '') {
        button.setAttribute('href', '/login')
        button.innerHTML = '♡';
        button.style.color = 'blue';
    }
    else {
        if (tweet.like === 0) { button.innerHTML = '♡'; button.style.color = 'blue'; }
        else { button.innerHTML = '❤'; button.style.color = 'red';}
        button.addEventListener('click', like_click_handler)
    }
    tweet_buttons.appendChild(button);


    return grid_item
}



function submit_tweet_handler() {
    fetch('/tweets', {
        method: 'POST',
        body: JSON.stringify({
            tweetText: document.querySelector('#tweet-form > textarea').value
        })
    })
    .then(response => response.json())
    .then(tweet => {
        // create and insert into html tweet in needed position
        let grid_item = create_tweet_element(tweet);
        let container = document.querySelector('.grid-container');
        container.insertBefore(grid_item, container.children[2]);
    })
    document.querySelector('#tweet-form > textarea').value = '';

    // animated

    return false
}


function profile_link_handler(event) {
    /* */
    document.querySelector("#tweet-field").style.display = 'none';
    document.querySelector('#profile').style.display = 'block';

    // fill in profile block
    id = event.target.getAttribute('data-id');
    fetch(`/profile?id=${id}`)
    .then(response => response.json())
    .then(profile_data =>{
        document.querySelector('#profile').setAttribute('data-id', profile_data.id);
        document.querySelector('#profile .username').innerHTML = profile_data.username;
        document.querySelector('#profile .following_num').innerHTML = `${profile_data.following_num} Following`;
        document.querySelector('#profile .followers_num').innerHTML = `${profile_data.followers_num} Followers`;
        follow_btn = document.querySelector('#profile .follow_btn');
        if (follow_btn) {
            // user == profile_user
            if (profile_data.follow_btn == '') {
                follow_btn.style.display = 'none'
            }
            else {
                follow_btn.style.display = "inline";
                follow_btn.innerHTML = profile_data.follow_btn;
                // add follow profile button click handler
                follow_btn.addEventListener('click', follow_btn_click_handler);
            }
        }
    })

    // load tweets
    load_tweets(`user&id=${id}`);
}


function follow_btn_click_handler(event) {
    fetch(`changestatus?follow=1&id=${document.querySelector('#profile').dataset.id}`)
    .then(response => {
        let btn = event.target;
        if (btn.innerHTML == 'Follow') {
            btn.innerHTML = 'Unfollow';
        }
        else {
            btn.innerHTML = 'Follow';
        }
    })
}


function like_click_handler(event) {
    let btn = event.target;
    fetch(`changestatus?like=1&id=${btn.parentElement.parentElement.dataset.id}`)
    .then(response => {
        if (btn.innerHTML == '♡') {
            btn.innerHTML = '❤';
            btn.style.color = 'red'
        }
        else {
            btn.innerHTML = '♡';
            btn.style.color = 'blue'
        }
    })
}