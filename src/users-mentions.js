(function(_, undefined) {
  "use strict";

  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g,
    variable    : "rc"
  };


  class UserMentions {

    constructor(settup, field) {
      let wrapper = document.createElement("div");
      wrapper.classList.add("users-mention-wrapper");

      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);

      this.settup = this.prepareSettup(settup);
      this.field = field;
      this.wrapper = wrapper;

      this.field.addEventListener("input", this.userInputEvent.bind(this), false);
    }


    prepareSettup(settup) {
      _.defaults(settup, {
        requestUrl: "",
        userList: [],
        getMentionsData: null,
        searchPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
        triggerChar: '@',
        lengthStartSearch: 3,
        templates: {
          container: _.template(
            `
              <div class='users-mention-list'>
                <%= rc.userListTemplate %>
              </div>
            `),
          userList: _.template(
            `
              <ul>
              <% _.forEach(rc.userList, function(user) { %>
                <li data-slug='<%= user.slug %>'>
                  <%= user.slug %>
                  <small><%= user.name %></small>
                </li>
              <% }); %>
              </ul>

              <select id='users-mention-list-select'>
                <% _.forEach(rc.userList, (user) => { %>
                  <option value='<%= user.slug %>'>
                    <%= user.slug %>
                  </option>
                <% }); %>
              </select>
            `)
        }
      });

      return settup;
    }


    userInputEvent(evt) {
      let hasMention = this.verifyIfHasMention();

      if (hasMention) {
        this.searchForMentions(this.getCurrentMention());
      }
    }


    verifyIfHasMention() {
      let found = false;
      let searchRegex = new RegExp(this.settup.searchPattern, 'g');
      let possibleMention = this.getCurrentMention();

      if (possibleMention.length >= this.settup.lengthStartSearch) {
        found = searchRegex.test(possibleMention);
      }

      return found;
    }


    getCurrentMention() {
      let currentText = this.field.value;
      let cursorPosition = this.field.selectionStart;
      let triggerPosition = currentText.lastIndexOf(this.settup.triggerChar, cursorPosition);
      let currentMention = "";

      // if there is a trigger and cursor is on valid position
      if (triggerPosition !== -1 && (currentText.charAt(cursorPosition-1) !== ' ')) {
        currentMention = currentText.slice(triggerPosition+1, cursorPosition);
      }

      return currentMention;
    }


    searchForMentions(currentMention) {
      let xhr = new XMLHttpRequest();
      let params = "mention=" + encodeURIComponent(currentMention);
      let requestUrl = this.settup.requestUrl + "?" + params;
      let currentInstance = this;

      if (/^\/.*$/.test(requestUrl)) {
        let currentLocation = window.location.href.replace(/\/$/, '');
        requestUrl = currentLocation + requestUrl;
      }

      xhr.open("GET", requestUrl, true);
      xhr.onreadystatechange = function onreadystatechange() {
        if (xhr.readyState === xhr.DONE && xhr.status === 200) {
          let response = JSON.parse(xhr.responseText);
          currentInstance.populateUserList(response);
        }
      }


      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.send(params);
    }


    populateUserList(userList) {
      this.settup.userList = userList;

      this.displayUserSelection();
    }


    displayUserSelection() {
      let listTemplate = this.buildTemplates();

      this.currentMention = this.getCurrentMention();

      this.removeUsersListDiv();
      this.field.insertAdjacentHTML("afterend", listTemplate);
      this.usersListDIV = this.wrapper.querySelector(".users-mention-list");

      this.field.onkeyup = this.fieldKeyUpEvent.bind(this);

      var usersListUL = this.usersListDIV.querySelector("ul");
      usersListUL.onclick = this.usersListUlOnClickEvent.bind(this);
    }


    removeUsersListDiv() {
      if (this.usersListDIV) {
        this.wrapper.removeChild(this.usersListDIV);
        this.usersListDIV = null;
      }
    }


    buildTemplates() {
      let userListTemplate = this.settup.templates.userList({
        userList: this.settup.userList
      });

      let containerTemplate = this.settup.templates.container({
        userListTemplate: userListTemplate
      });

      return containerTemplate;
    }


    fieldKeyUpEvent(evt) {
      // down 40, up 38
      if (evt.keyCode === 40 || evt.keyCode === 38) {
        this.field.blur();

        let usersListSelect = this.usersListDIV.querySelector("select");
        usersListSelect.focus();
        usersListSelect.selectedIndex = 0;
        usersListSelect.onchange = this.usersListSelectChangeEvent.bind(this);
        usersListSelect.onkeypress = this.usersListSelectOnKeyPress.bind(this);

        let usersListFristLI = this.usersListDIV.querySelector("ul li");
        usersListFristLI.className = "selected";
      }
    }


    usersListSelectChangeEvent(evt) {
      let searchRegex = new RegExp(evt.target.value);
      let usersListLI = this.usersListDIV.querySelectorAll("ul li");
      let currentSelectedLI = this.usersListDIV.querySelectorAll("ul li.selected");

      [].forEach.call(currentSelectedLI, li => li.className = "");

      let itens = [].filter.call(usersListLI, (li) => searchRegex.test(li.textContent));

      if (itens.length) {
        let li = itens[0];
        li.className = "selected";
      }
    }


    usersListSelectOnKeyPress(evt) {
      // 13 -> Enter
      if (evt.keyCode === 13) {
        this.chooseMention(evt.target.value);
      }
    }


    usersListUlOnClickEvent(evt) {
      let clickedItem = evt.target;

      if (clickedItem.tagName !== "LI") {
        clickedItem = clickedItem.parentNode;
      }

      let slug = clickedItem.getAttribute("data-slug");

      this.chooseMention(slug);
    }


    chooseMention(mention) {
      this.removeUsersListDiv();
      console.log("Selected: " + mention, this.currentMention);
      this.field.value = this.field.value.replace("@"+this.currentMention, "@"+mention);
      this.field.focus();
    }
  }


  document.addEventListener("DOMContentLoaded", () => {
    let elements = document.querySelectorAll("textarea[data-users-mention-field]");

    [].forEach.call(elements, (el) => {
      let dataAttr = [].filter.call(el.attributes, at => /^data-(?!users-mention)/.test(at.name));

      let settup = {};
      dataAttr.forEach((attr) => {
        let name = attr.name.replace("data-", "");
        name = name.replace(/-([a-z])/g, (_, firstLetter) => firstLetter.toUpperCase());
        let value = attr.value;

        settup[name] = value;
      });

      let userMentions = new UserMentions(settup, el);
    });
  }, false);

}) (_.runInContext());
