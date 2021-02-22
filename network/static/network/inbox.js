
window.onpopstate = function(event) {
    type = event.state.type;

    if (type === 'all-posts' || type === 'following' || type === 'self') {
        nav_buttons_handler(type);
    }
    else if (type === 'profile') {
        profLink_click_handler(event.state.id);
    }
    else if (type === 'pagination') {
        load_tweets(event.state.subtype, event.state.page);
    }
    else if (type === 'comments') {
        commentButton_click_handler(event.state.tweet_id);
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
    document.querySelector('#tweet-form').onsubmit = submit_message_handler;

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
        profLink_click_handler('self');
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


function createElement_message(message, type=null) {
    let container = document.createElement('div');
    container.dataset.id = message.id;

    if (type === "comment") {
        container.className = "comment-container";
    }
    else {container.className = "grid-item tweet-container";}

    container.appendChild(createElement_message_fromInfo(message));
    container.appendChild(createElement_message_text(message.text));
    if (message.edit) {
        container.appendChild(createElement_message_editMark());
    }
    container.appendChild(createElement_message_buttons(message, type));

    return container;
}


function createElement_message_fromInfo(message) {
    let from_info = document.createElement('div');
    from_info.className = "from-info";

    from_info.appendChild(createElement_profLink(message.user_id ,message.username));
    from_info.appendChild(createElement_timestamp(message.timestamp));

    return from_info;
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
        profLink_click_handler(pr_id);
        window.scroll(0, 0);
    });

    return prof_link;
}


function createElement_timestamp(timestamp) {
    let timestamp_mark = document.createElement('span');
    timestamp_mark.className = 'timestamp';
    timestamp_mark.innerHTML = timestamp;
    return timestamp_mark;
}


function createElement_message_text(text) {
    let message_text = document.createElement('div');
    message_text.className = 'message';
    // replace \n on <br> in text for correct text display
    message_text.innerHTML = text.replace(/\n/g, '<br>');
    return message_text;
}


function createElement_message_editMark() {
    edit_mark = document.createElement('div');
    edit_mark.className = 'edit-mark-container';
    edit_mark.innerHTML = 'edited';
    return edit_mark;
}


function createElement_message_buttons(message, type) {
    let message_buttons = document.createElement('div');
    message_buttons.className = 'message-buttons';

    // comments button
    if (!type) {
        message_buttons.appendChild(createElement_commentButton(message.comments_num));
    }
    // edit button
    if (message.own) {
        message_buttons.appendChild(createElement_editButton(type));
    }
    // like button
    message_buttons.appendChild(createElement_likeButton(message.like, message.likes_num, type));

    return message_buttons;
}


function createElement_commentButton(comments_num) {
    let span = document.createElement('span');

    span.appendChild(createElement_commentBadge());
    span.appendChild(createElement_commentSign(comments_num));

    return span
}


function createElement_commentBadge() {
    let button = document.createElement('a');
    button.innerHTML = '💬';
    button.className = 'comment-btn';
    button.title = 'comments';
    button.addEventListener('click', (event) => {
        id = event.target.parentElement.parentElement.parentElement.dataset.id;
        history.pushState({type: "comments", tweet_id: id}, '', `/posts/${id}/comments/`);
        commentButton_click_handler(id);
    });
    return button;
}


function createElement_commentSign(comments_num) {
    text_span = document.createElement('span');
    text_span.className = 'comments-number';
    text_span.innerHTML = comments_num;
    return text_span;
}


function createElement_editButton(type) {
    let button = document.createElement('а');
    button.className = 'edit-button';
    button.innerHTML = '✎';
    button.title = "edit";
    button.addEventListener('click', (event, type_ = type) => {
        editButton_click_handler(event, type_);
    });
    return button;
}


function createElement_likeButton(like, likes_num, type) {
    let span = document.createElement('span');

    span.appendChild(createElement_likeHeart(like, type));

    span.appendChild(createElement_likeSign(likes_num));

    return span;
}


function createElement_likeHeart(like, type) {
    button = document.createElement('a');
    button.className = 'like-btn';
    if (like === '') {
        button.setAttribute('href', '/login')
        button.innerHTML = '♡';
        button.style.color = 'blue';
    }
    else {
        if (like === 0) { button.innerHTML = '♡'; button.style.color = 'blue'; }
        else { button.innerHTML = '❤'; button.style.color = 'red';}
        button.addEventListener('click', (event, type_=type) => {
            likeHeart_click_handler(event, type_);
        });
    }

    return button
}


function createElement_likeSign(likes_num) {
    text_span = document.createElement('span');
    text_span.className = 'likes-number';
    text_span.innerHTML = likes_num;
    return text_span;
}



function submit_message_handler(event, type = null, subtype=null) {
    let textarea = event.target.firstElementChild;
    let url = "/tweet";

    if (subtype === "new_comment") {
        let tweet_id = event.target.parentElement.parentElement.parentElement.children[2].dataset.id;
        url = `/comments/${tweet_id}`
     }

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            tweetText: textarea.value
        })
    })
    .then(response => response.json())
    .then(tweet => {
        // create and insert into html tweet in needed position
        let message_container = createElement_message(tweet, type);
        let container = event.target.parentElement.parentElement;
        if (subtype === "new_comment") { container.appendChild(message_container); }
        else { container.insertBefore(message_container, container.children[2]); }

        textarea.value = '';
        textarea.style.height = '5px';
        if (subtype === "new_comment") {
            window.scroll(0, document.body.offsetHeight + window.scrollY);
        }
    })


    // animated

    return false
}


function profLink_click_handler(id) {
    document.querySelector("#tweet-field").style.display = 'none';
    document.querySelector('#profile').style.display = 'block';

    fetch(`/profile?id=${id}`)
    .then(response => response.json())
    .then(profile_data => {
        profile_container_filler(profile_data);
    })

    load_tweets(`user&id=${id}`, 1);
}


function profile_container_filler(profile_data) {
    document.querySelector('#profile').setAttribute('data-id', profile_data.id);
    document.querySelector('#profile .username').innerHTML = profile_data.username;
    document.querySelector('#profile .following_num').innerHTML = `${profile_data.following_num} Following`;
    document.querySelector('#profile .followers_num').innerHTML = `${profile_data.followers_num} Followers`;
    follow_btn = document.querySelector('#profile .follow_btn');
    // user is auth
    if (follow_btn) {
        // user == profile_user
        if (profile_data.follow_btn == '') {
            follow_btn.style.display = 'none'
        }
        else {
            follow_btn.style.display = "inline";
            follow_btn.innerHTML = profile_data.follow_btn;
            follow_btn.addEventListener('click', follow_btn_click_handler);
        }
    }
}


function follow_btn_click_handler(event) {
    fetch(`/changestatus?follow=1&id=${document.querySelector('#profile').dataset.id}`)
    .then(response => response.json())
    .then(data => {
        let btn = event.target;
        if (btn.innerHTML == 'Follow') {
            btn.innerHTML = 'Unfollow';
        }
        else {
            btn.innerHTML = 'Follow';
        }
        document.querySelector('.followers_num').innerHTML = `${data.followers_num} Followers`;
    })
}


function likeHeart_click_handler(event, type) {
    let btn = event.target;
    fetch(`/changestatus?like=1&id=${btn.parentElement.parentElement.parentElement.dataset.id}&model=${type}`)
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


function editButton_click_handler(event, type) {
    let message_container = event.target.parentElement.parentElement;

    let form_container = createElement_editFormContainer(event, type);
    form_container.dataset.id = message_container.dataset.id;

    message_container.parentElement.insertBefore(form_container, message_container);
    // set initial height for form_container
    textarea = form_container.firstChild.firstChild;
    textarea.style.height = `${textarea.scrollHeight}px`;
    // hide the tweet
    message_container.style.display = 'none';


}


function createElement_editFormContainer(event, type) {
    let form_container = document.createElement('div');
    if (type === 'comment') {
        form_container.className = 'comment-edit-field';
    }
    else {
        form_container.className = 'grid-item tweet-edit-field';
    }

    form_container.appendChild(createElement_simpleForm(event, type));


    return form_container;
}


function createElement_simpleForm(event, type=null, subtype=null) {
    let form = document.createElement('form');
    form.className = 'flex-container';
    form.onsubmit = (event, subtype_ = subtype) => {
        if (subtype_ === "new_comment") {
            return submit_message_handler(event, 'comment', subtype_);
        }
        else {
            return submit_simpleForm_edit_handler(event, type);
        }
    };

    let textarea = createElement_textarea(event, subtype);
    form.appendChild(textarea);

    let input = createElement_input(subtype);
    form.appendChild(input);

    return form
}


function createElement_textarea(event, subtype) {
    textarea = document.createElement('textarea');
    textarea.addEventListener('input', auto_grow);
    textarea.maxLength = "1000";
    textarea.required = true;
    if (subtype === "new_comment") {
        textarea.value = '';
        textarea.placeholder = 'tweet your comment :^'
    }
    else {
        textarea.value = event.target.parentElement.parentElement.children[1].innerHTML.replace(/<br>/g, '\n');
        textarea.className = 'textarea-edit-tweet';
    }

    return textarea
}


function createElement_input(subtype) {
    let input = document.createElement('input');
    input.className = 'submit-button-textarea';
    input.setAttribute('type', 'submit');
    if (subtype === "new_comment") { input.setAttribute('value', 'Comment'); }
    else { input.setAttribute('value', 'Edit'); }

    return input
}


function submit_simpleForm_edit_handler(event, type=null) {
    if (!type) { type = 'tweet' };

    edit_item = event.target.parentElement;
    fetch(`/edit/${type}`, {
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
        // choose hidden message container
        let message_container = edit_item.nextElementSibling;
        // fill in new message text in message container
        message_container.children[1].innerHTML = tweet.text.replace(/\n/g, '<br>');
        // show message container and remove edit item
        message_container.style.display = 'block';
        edit_item.remove();
    })
    return false;
}


function create_pagination(service, type, cur_page) {
    // create div-container pagination and 2 <a>: prev and next
    let pag_container = document.createElement('div');
    pag_container.className = "grid-item flex-space-between";
    pag_container.id = "pagination-container";

    let prev = createElement_prevButton(type, cur_page);
    let next = createElement_nextButton(type, cur_page);

    // fill in pagination-container
    if (service.has_next && service.has_prev) {
        pag_container.appendChild(prev);
        pag_container.appendChild(next);
    }
    else if (service.has_next) {
        pag_container.appendChild(next);
    }
    else if (service.has_prev) {
        pag_container.appendChild(prev);
    }

    return pag_container
}


function createElement_prevButton(type, cur_page) {
    prev = document.createElement('a');
    prev.className = 'previous-link';
    prev.innerHTML = 'Previous';
    prev.addEventListener('click', (event, type_ = type, page=cur_page - 1) => {
        history.pushState({type: 'pagination', page: page, subtype: type_}, '', `/${type_}/page=${page}`);
        window.scroll(0, 0);
        load_tweets(type_, page);
    });
    return prev;
}


function createElement_nextButton(type, cur_page) {
    next = document.createElement('a');
    next.className = 'next-link';
    next.innerHTML = 'Next';
    next.addEventListener('click', (event, type_ = type, page=cur_page + 1) => {
        history.pushState({type: 'pagination', page: page, subtype: type_}, '', `/${type_}/page=${page}`);
        window.scroll(0, 0);
        load_tweets(type_, page);
    });
    return next;
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


function commentButton_click_handler(tweet_id) {
    // hide profile and tweet-field
    document.querySelector('#profile').style.display = 'none';
    document.querySelector('#tweet-field').style.display = 'none';

    // clean grid-container
    remove_children(document.querySelector(".grid-container"), 3);
    // replace the tweet-item on third place in grid-container
    load_tweet(tweet_id);

    // create empty grid-container with padding
    let comments_container = document.createElement('div');
    comments_container.className = "comments-container grid-item";

    // create form for new message and add it in comments-container
    let form_container = document.createElement('div');
    form_container.className = 'new-message-container';
    form_container.appendChild(createElement_simpleForm(null, null, 'new_comment'));
    comments_container.appendChild(form_container);

    // load comments in
    load_comments(comments_container, tweet_id);
}


function load_comments(comments_container, tweet_id) {
    fetch(`/comments/${tweet_id}`)
        .then(response => response.json())
        .then(data => {
            data.comments.forEach(comment => {
                comment_item = createElement_message(comment, type='comment');
                comments_container.appendChild(comment_item);
            })
            // add comments container in DOM
            document.querySelector(".grid-container").appendChild(comments_container);
            // if user is anonymous hide form for create comment
            if (!data.service.user) {
                document.querySelector('.new-message-container').style.display = 'none';
            }
        })
}


function find_tweet_element(id) {
    tweets = Array.from(document.querySelector('.grid-container').children);
    for (let i = 2; i < tweets.length; i++) {
        if (tweets[i].dataset.id === id) {
            return tweets[i];
        }
    }
}


function load_tweet(id) {
    fetch(`/tweet?id=${id}`)
    .then(response => response.json())
    .then(tweet => {
        let grid_container = document.querySelector(".grid-container");
        // create tweet item and add it in grid-container
        let grid_item = createElement_message(tweet);
        grid_container.replaceChild(grid_item, grid_container.children[2]);
    })
}