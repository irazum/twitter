
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
        load_tweets('allPosts', 1);
    });

    // tweet-form handler
    document.querySelector('#tweet-form > textarea').oninput = auto_grow;
    document.querySelector('#tweet-form').onsubmit = submit_tweet_handler;

    // following nav button click handler
    if (document.querySelector('#following')) {
        document.querySelector('#following').addEventListener("click", () => {
            document.querySelector("#tweet-field").style.display = 'block';
            document.querySelector('#profile').style.display = 'none';
            load_tweets('following', 1);
        });
    }

    // self button handler
    if (document.querySelector('#self-btn')) {
         document.querySelector('#self-btn').addEventListener("click", (event) => {
            profile_link_handler(event, 'self');
        });
    }


    // load tweets for home page (all twits)
    if (document.querySelector('#tweet-field').dataset.is_auth) {
        document.querySelector("#tweet-field").style.display = 'block';
    } else { document.querySelector("#tweet-field").style.display = 'none'; }

    document.querySelector('#profile').style.display = 'none';
    load_tweets("allPosts", 1);


});


function load_tweets(type, page) {
/*
Функция делает асинхронный запрос на "/tweets" , передавая доп. параметры в строке запроса
type == following or all_posts. После сериализует json-ответ, создаёт в цикле grid-item на его основе.
*/
    fetch(`/tweets?type=${type}&page=${page}`)
    .then(response => response.json())
    .then(data => {
        /* drop old tweet grid-items */
        items = document.querySelector(".grid-container").children;
        // transform nodeList in Array
        items = Array.from(items);
        items = items.slice(2, items.length);
        items.forEach(item => {
            item.remove();
        });

        data.tweets.forEach(tweet => {
            /* create new tweet grid-item */
            let grid_item = create_tweet_element(tweet);
            document.querySelector(".grid-container").append(grid_item);
        });

        pag_container = create_pagination(data.service, type, page);
        document.querySelector('.grid-container').appendChild(pag_container);
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
    // replace \n on <br> in text for correct text display
    tweet_text.innerHTML = tweet.text.replace(/\n/g, '<br>');

    grid_item.appendChild(tweet_text);

    if (tweet.edit) {
        edit_mark = document.createElement('div');
        edit_mark.className = 'edit-mark-container';
        edit_mark.innerHTML = 'edited';
        grid_item.appendChild(edit_mark);
    }

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


    /* elements in tweet_buttons */
    // edit button
    let button = document.createElement('а');
    button.className = 'edit-button';

    if (tweet.own) {
        button.innerHTML = 'Edit';
        button.addEventListener('click', edit_tweet_button_handler);
    }

    tweet_buttons.appendChild(button);


    // comments button
    button = document.createElement('a');
    button.innerHTML = 'comm';
    tweet_buttons.appendChild(button);

    // like button
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


function profile_link_handler(event, self_flag=null) {
    /* */
    document.querySelector("#tweet-field").style.display = 'none';
    document.querySelector('#profile').style.display = 'block';

    /* fill in profile block */
    if (self_flag === 'self') { id = self_flag; }
    else { id = event.target.getAttribute('data-id'); }

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
    load_tweets(`user&id=${id}`, 1);
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



function edit_tweet_button_handler(event) {
    let tweet_cur_item = event.target.parentElement.parentElement;
    // create edit tweet field
    let tweet_field = create_tweet_edit_field(event);
    tweet_field.dataset.id = tweet_cur_item.dataset.id;
    // insert edit tweet field into the DOM
    tweet_cur_item.parentElement.insertBefore(tweet_field, tweet_cur_item);

    // set initial height for tweet_field
    textarea = tweet_field.firstChild.firstChild;
    textarea.style.height = `${textarea.scrollHeight}px`;

    // hide the tweet
    tweet_cur_item.style.display = 'none';


}


function create_tweet_edit_field(event) {
    let tweet_field = document.createElement('div');
    tweet_field.className = 'grid-item tweet-edit-field';

    let form = document.createElement('form');
    form.className = 'flex-container edit-tweet-form';
    form.onsubmit = edit_form_button_handler;
    tweet_field.appendChild(form);

    /* elements in form */
    textarea = document.createElement('textarea');
    // insert tweet text from tweet-container in textarea
    textarea.value = event.target.parentElement.parentElement.children[1].innerHTML.replace(/<br>/g, '\n');
    textarea.addEventListener('input', auto_grow);
    form.appendChild(textarea);

    let input = document.createElement('input');
    input.className = 'submit-edit-tweet';
    input.setAttribute('type', 'submit');
    input.setAttribute('value', 'edit');
    form.appendChild(input);

    return tweet_field;
}


function edit_form_button_handler(event) {
    edit_item = event.target.parentElement;
    fetch('edit/tweet', {
        method: 'POST',
        body: JSON.stringify({
            id: edit_item.dataset.id,
            text: event.target.firstChild.value
        })
    })
    .then(response => response.json())
    .then(tweet => {
        // choose hidden tweet container
        let tweet_container = edit_item.nextElementSibling;
        // fill in new tweet text in tweet container
        tweet_container.children[1].innerHTML = tweet.text.replace(/\n/g, '<br>');

        // show the tweet and remove edit item
        tweet_container.style.display = 'block';
        edit_item.remove();
    })
    return false;
}


function create_pagination(service, type, cur_page) {
    // create div-container pagination and 2 <a>: prev and next
    pag_container = document.createElement('div');
    pag_container.className = "grid-item flex-space-between";
    pag_container.id = "pagination-container";


    prev = document.createElement('a');
    prev.className = 'previous-link';
    prev.setAttribute('href', '#top');
    prev.innerHTML = 'Previous';
    prev.addEventListener('click', (event, type_ = type, page=cur_page - 1) => {
        load_tweets(type_, page);
    });

    next = document.createElement('a');
    next.className = 'next-link';
    next.setAttribute('href', '#top');
    next.innerHTML = 'Next';
    next.addEventListener('click', (event, type_ = type, page=cur_page + 1) => {
        load_tweets(type_, page);
    });

    // fill in pagination-container
    if (service.has_next && service.has_prev) {
        // add in pagination prev and next
        pag_container.appendChild(prev);
        pag_container.appendChild(next);
    }
    else if (service.has_next) {
        // add in pagination next
        pag_container.appendChild(next);
    }
    else if (service.has_prev) {
        // add in pagination prev
        pag_container.appendChild(prev);
    }

    // add pagination-container in the DOM
    return pag_container
}

