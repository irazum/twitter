
window.onpopstate = function(event) {
    type = event.state.type;

    if (type === 'all-posts' || type === 'following' || type === 'self') {
        nav_buttons_handler(type);
    }
    else if (type === 'profile') {
        profile_link_handler(event.state.id);
    }
    else if (type === 'pagination') {
        load_tweets(event.state.subtype, event.state.page);
    }
}



document.addEventListener("DOMContentLoaded", () => {

    // all-post nav button click handler
    document.querySelector('#all-posts').removeAttribute('href');
    document.querySelector('#all-posts').addEventListener("click", () => {
        history.pushState({type: "all-posts", page: 1}, '', '/allPosts/page=1');
        nav_buttons_handler('all-posts');
    });

    // following nav button click handler
    if (document.querySelector('#following')) {
        document.querySelector('#following').addEventListener("click", () => {
            history.pushState({type: "following", page: 1}, '', '/following/page=1');
            nav_buttons_handler('following')
        });
    }

    // self nav button click handler
    if (document.querySelector('#self-btn')) {
         document.querySelector('#self-btn').addEventListener("click", (event) => {
            history.pushState({type: "self", page: 1}, '', '/self/page=1')
            nav_buttons_handler('self');
        });
    }

    // tweet-form handler
    document.querySelector('#tweet-form > textarea').oninput = auto_grow;
    document.querySelector('#tweet-form').onsubmit = submit_tweet_handler;

    // load tweets for home page (all twits)
    nav_buttons_handler('all-posts');
    history.pushState({type: "all-posts", page: 1}, '', '/allPosts/page=1');

});


function nav_buttons_handler(btnName) {
    if (btnName === 'all-posts') {
        document.querySelector('#profile').style.display = 'none';
        if (document.querySelector('#tweet-field').dataset.is_auth) {
            document.querySelector("#tweet-field").style.display = 'block';
        } else { document.querySelector("#tweet-field").style.display = 'none'; }

        load_tweets('allPosts', 1);
    }

    else if (btnName === "following") {
        document.querySelector("#tweet-field").style.display = 'block';
        document.querySelector('#profile').style.display = 'none';
        load_tweets('following', 1);
    }

    else if (btnName === "self") {
        profile_link_handler('self');
    }
}



function auto_grow(event) {
    element = event.target
    element.style.height = "5px";
    element.style.height = `${element.scrollHeight}px`;
}


function load_tweets(type, page) {
    fetch(`/tweets?type=${type}&page=${page}`)
    .then(response => response.json())
    .then(data => {
        /* drop old tweet grid-items */
        remove_children(document.querySelector(".grid-container"), 2)

        data.tweets.forEach(tweet => {
            /* create new tweet grid-item */
            let grid_item = createElement_message(tweet);
            document.querySelector(".grid-container").append(grid_item);
        });

        pag_container = create_pagination(data.service, type, page);
        document.querySelector('.grid-container').appendChild(pag_container);
    })
}



function remove_children(container, start_index=0) {
    items = container.children;
    // transform nodeList in Array
    items = Array.from(items);
    items = items.slice(start_index, items.length);
    items.forEach(item => {
        item.remove();
    });
}





function createElement_message(tweet) {
    // create main element
    let grid_item = document.createElement('div');
    grid_item.className = "grid-item tweet-container";
    grid_item.dataset.id = tweet.id;

    grid_item.appendChild(createElement_message_fromInfo(tweet));
    grid_item.appendChild(createElement_message_text(tweet));
    if (tweet.edit) {
        grid_item.appendChild(createElement_message_editMark());
    }
    grid_item.appendChild(createElement_message_buttons(tweet));


    return grid_item
}




function createElement_message_fromInfo(tweet) {
    /* elements in grid item */
    let from_info = document.createElement('div');
    from_info.className = "from-info";

    prof_link = createElement_profLink(tweet.user_id ,tweet.username);
    from_info.appendChild(prof_link);

    from_info.appendChild(createElement_timestamp(tweet.timestamp));

    return from_info
}


function createElement_profLink(user_id, username) {
    // elements in from_info
    let prof_link = document.createElement('a');
    prof_link.className = 'profile-link';
    prof_link.setAttribute('data-id', user_id);
    prof_link.innerHTML = username;

    prof_link.addEventListener('click', (event) => {
        pr_id = event.target.getAttribute('data-id');
        history.pushState({type: "profile", id: pr_id, page: 1}, "", `/profile/${pr_id}/page=1`)
        profile_link_handler(pr_id);
        window.scroll(0, 0);
    });

    return prof_link
}

function createElement_timestamp(timestamp) {
    let timestamp_mark = document.createElement('span');
    timestamp_mark.className = 'timestamp';
    timestamp_mark.innerHTML = timestamp;
    return timestamp_mark
}


function createElement_message_text(tweet) {
    let tweet_text = document.createElement('div');
    tweet_text.className = 'message';
    // replace \n on <br> in text for correct text display
    tweet_text.innerHTML = tweet.text.replace(/\n/g, '<br>');
    return tweet_text
}



function createElement_message_editMark() {
    edit_mark = document.createElement('div');
    edit_mark.className = 'edit-mark-container';
    edit_mark.innerHTML = 'edited';
    return edit_mark
}



function createElement_message_buttons(tweet) {
    let tweet_buttons = document.createElement('div');
    tweet_buttons.className = 'tweet-buttons';

    // comments button
    tweet_buttons.appendChild(createElement_commentButton(tweet));
    // edit button
    if (tweet.own) {
        tweet_buttons.appendChild(createElement_editButton());
    }
    // like button
    tweet_buttons.appendChild(createElement_likeButton(tweet));

    return tweet_buttons
}


function createElement_commentButton(tweet) {
    let button = document.createElement('a');
    button.innerHTML = '💬';
    button.className = 'comment-btn';
    button.title = 'comments';
    button.addEventListener('click', comment_btn_click_handler)
    return button
}

function createElement_editButton() {
    let button = document.createElement('а');
    button.className = 'edit-button';
    button.innerHTML = '✎';
    button.title = "edit";
    button.addEventListener('click', edit_tweet_button_handler);
    return button
}

function createElement_likeButton(tweet) {
    let span = document.createElement('span');

    span.appendChild(createElement_likeHeart(tweet));

    span.appendChild(createElement_likeSign(tweet));

    return span
}


function createElement_likeHeart(tweet) {
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

    return button
}

function createElement_likeSign(tweet) {
    text_span = document.createElement('span');
    text_span.className = 'likes-number';
    text_span.innerHTML = tweet.likes_num;
    return text_span
}





function fill_message_container(grid_item, message) {
    /*
    container --> DOM-element
    message --> dict with message data
    --> return null
    */

}










function submit_tweet_handler(event) {
    fetch('/tweets', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            tweetText: document.querySelector('#tweet-form > textarea').value
        })
    })
    .then(response => response.json())
    .then(tweet => {
        // create and insert into html tweet in needed position
        let grid_item = createElement_message(tweet);
        let container = document.querySelector('.grid-container');
        container.insertBefore(grid_item, container.children[2]);
    })
    document.querySelector('#tweet-form > textarea').value = '';

    // animated

    return false
}


function profile_link_handler(id) {
    /* */
    document.querySelector("#tweet-field").style.display = 'none';
    document.querySelector('#profile').style.display = 'block';

    /* fill in profile block */
    fetch(`/profile?id=${id}`)
    .then(response => response.json())
    .then(profile_data => {
        profile_container_filler(profile_data);
    })

    // load tweets
    load_tweets(`user&id=${id}`, 1);
}


function profile_container_filler(profile_data) {
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
}



function follow_btn_click_handler(event) {
    fetch(`/changestatus?follow=1&id=${document.querySelector('#profile').dataset.id}`)
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
    fetch(`/changestatus?like=1&id=${btn.parentElement.parentElement.parentElement.dataset.id}`)
    .then(response => response.json())
    .then(data => {
        if (btn.innerHTML == '♡') {
            btn.innerHTML = '❤';
            btn.style.color = 'red'
        }
        else {
            btn.innerHTML = '♡';
            btn.style.color = 'blue'
        }
        btn.nextElementSibling.innerHTML = data.likes_num;
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
    textarea.className = 'textarea-edit-tweet';
    textarea.maxLength = "1000";
    textarea.required = true;
    form.appendChild(textarea);

    let input = document.createElement('input');
    input.className = 'submit-edit-tweet';
    input.setAttribute('type', 'submit');
    input.setAttribute('value', 'Edit');
    form.appendChild(input);

    return tweet_field;
}


function edit_form_button_handler(event) {
    edit_item = event.target.parentElement;
    fetch('/edit/tweet', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
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
    prev.innerHTML = 'Previous';
    prev.addEventListener('click', (event, type_ = type, page=cur_page - 1) => {
        history.pushState({type: 'pagination', page: page, subtype: type_}, '', `/${type_}/page=${page}`);
        window.scroll(0, 0);
        load_tweets(type_, page);
    });

    next = document.createElement('a');
    next.className = 'next-link';
    next.innerHTML = 'Next';
    next.addEventListener('click', (event, type_ = type, page=cur_page + 1) => {
        history.pushState({type: 'pagination', page: page, subtype: type_}, '', `/${type_}/page=${page}`);
        window.scroll(0, 0);
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


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}



function comment_btn_click_handler(event) {
    // hide profile and tweet-field
    document.querySelector('#profile').style.display = 'none';
    document.querySelector('#tweet-field').style.display = 'none';

    // replace the tweet-item on third place in grid-container
    tweet = event.target.parentElement.parentElement;
    let container = document.querySelector('.grid-container');
    container.insertBefore(tweet, container.children[2]);

    // remove below elements
    remove_children(document.querySelector(".grid-container"), 3);

    // send fetch request to spec url /comments/<tweet_id>
    /*
    fetch(`/comments/${tweet.dataset.id}`)
    .then(response => response.json())
    .then(comments => {

        // create spec grid-item with padding
        let grid_item

        // create in cycle comment elements from response-data and add these in the grid-item

    })

    */
}