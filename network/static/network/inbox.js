
function auto_grow(event) {
    element = event.target
    element.style.height = "5px";
    element.style.height = `${element.scrollHeight}px`;
}


document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector('.grid-container')) {
        document.querySelector('#all-posts').addEventListener("click", () => load_tweets('allPosts'));
    }
    else {
        document.querySelector('#all-posts').setAttribute('href', '/');
    }

    if (document.querySelector('#following')) {
        document.querySelector('#following').addEventListener("click", () => load_tweets('following'));
    }

    if (document.querySelector('#tweet-form')) {
        document.querySelector('#tweet-form > textarea').oninput = auto_grow;

        document.querySelector('#tweet-form').onsubmit = submit_tweet_handler;
    }

    // load tweets for home page (all twits)
    if (document.querySelector('.grid-container') && !document.querySelector('#profile') ) {
        load_tweets("allPosts");
    }

    if (document.querySelector('#profile')) {
        load_tweets(document.querySelector('#profile').dataset.id);
    }

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
            items = items.slice(1, items.length);
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
    grid_item.className = "grid-item";
    grid_item.id = "posts";

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
    prof_link.setAttribute('href', `/profile?id=${tweet.user_id}`);
    prof_link.className = 'profile-link';
    prof_link.innerHTML = tweet.username;
    from_info.appendChild(prof_link);

    let timestamp = document.createElement('span');
    timestamp.innerHTML = tweet.timestamp;
    from_info.appendChild(timestamp);

    // elements in tweet_buttons
    for (let i = 0; i < 3; i++) {
        let button = document.createElement('button');
        button.innerHTML = 'button'
        tweet_buttons.appendChild(button);
    }

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
        container.insertBefore(grid_item, container.children[1]);
    })
    document.querySelector('#tweet-form > textarea').value = '';

    // animated

    return false
}


