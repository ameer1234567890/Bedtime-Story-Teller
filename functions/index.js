'use strict';

const {
  dialogflow,
  Suggestions,
} = require('actions-on-google');

const functions = require('firebase-functions');
const storiesData = require('./stories.js');
const app = dialogflow({debug: false});
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const uuidv4 = require('uuid/v4');

// Some alternative welcome messages
const welcomeMessages = [
  {text: 'Hi! Welcome to Bedtime Story Teller.',},
  {text: 'Hi! It\'s story time.',},
  {text: 'Hi! It\'s time for some stories.',},
  {text: 'Hi! let\'s get started with bedtime stories.',},
];

// List denoting new story numbers
const newStories = [
  {number: 49,},
  {number: 50,},
  {number: 51,},
];

// Random number generator for stories
const genRandom = () => {
  return Math.floor(Math.random() * storiesData.length);
}

// Generate a random story number
const randomStoryNum = (conv) => {
  let listenedStories = [];
  let random = genRandom();
  if (conv.user.verification === 'VERIFIED') {
    if (conv.data.listenedStories) {
      listenedStories = conv.data.listenedStories;
    }
    let found = listenedStories.find((element) => {
      return element === random;
    });
    while (found) {
      random = genRandom();
      found = listenedStories.find((element) => { // eslint-disable-line no-loop-func
        return element === random;
      });
    }
    listenedStories.push(random);
    if (listenedStories.length > 10) {
      listenedStories = listenedStories.slice(1, 11);
    }
    conv.data.listenedStories = listenedStories;
  }
  return random;
};

// Get the next story number
const newStoryNum = (conv) => {
  let listenedNewStories = [];
  let newStory = 0;
  if (conv.user.verification === 'VERIFIED') {
    if (conv.data.listenedNewStories) {
      listenedNewStories = conv.data.listenedNewStories;
      newStory = listenedNewStories[listenedNewStories.length - 1] + 1;
    }
    if (newStory > (newStories.length - 1)) {
      newStory = 0;
    }
    if (listenedNewStories.length > newStories.length) {
      listenedNewStories = listenedNewStories.slice(1, newStories.length);
    }
    listenedNewStories.push(newStory);
    conv.data.listenedNewStories = listenedNewStories;
  }
  return newStory;
};

// Handle 'Default Welcome Intent'
app.intent('Default Welcome Intent', (conv) => {
  if (conv.user.verification === 'VERIFIED' && !conv.user.storage.uid) {
    let uid = uuidv4();
    let date = new Date();
    db.collection('users').doc(uid).set({ registered: date })
    .then(() => { return console.log('New user ID generated!'); })
    .catch((error) => { return console.error('Error writing new user ID: ', error); });
    conv.user.storage.uid = uid;
  }
  let random = Math.floor(Math.random() * welcomeMessages.length);
  conv.ask(welcomeMessages[random].text + ' Please say "tell me a story" to start listening stories.');
  conv.ask(new Suggestions('Tell me a story', 'Tell me lot of stories', 'No thanks'));
});

// When 'Tell me a story' is said after the welcome intent or when 'yes' is answered
app.intent(['Default Welcome Intent - start', 'story intent', 'stories intent - yes'], (conv) => {
  tellStory(conv);
});

// When 'Tell me lot of stories' is said
app.intent('Default Welcome Intent - continuous', (conv) => {
  tellStoriesContinuous(conv);
});

// When 'Tell me new stories' is said
app.intent('Default Welcome Intent - new', (conv) => {
  let message = 'There are ' + newStories.length + ' new stories. Do you want to start?';
  conv.ask(new Suggestions('Yes', 'No thanks'));
  conv.ask(message);
});

// When 'yes' is answered after 'Tell me new stories' is said
app.intent(['Default Welcome Intent - new - yes'], (conv) => {
  tellNewStory(conv);
});

// When there is no response
app.intent('actions_intent_NO_INPUT', (conv) => {
  // Use the number of reprompts to vary response
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask('Do you want to listen to another story?');
  } else if (repromptCount === 1) {
    conv.ask('Do you want to listen to another story?');
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close('OK. I got no response! Good bye!');
  }
});

// Tell the actual story
const tellStory = (conv) => {
  let i = randomStoryNum(conv);
  conv.ask('<speak>Story name: ' + storiesData[i].title + '! ' + storiesData[i].text + '</speak>');
  conv.ask('Do you want to listen to another story?');
  conv.ask(new Suggestions('Yes', 'Tell me lot of stories', 'No thanks'));
};

// Tell stories in continuous mode
const tellStoriesContinuous = (conv) => {
  let stories = '';
  for (let j = 0; j < 5; j++) {
    let i = randomStoryNum(conv);
    stories += 'Story name: ' + storiesData[i].title + '! ' + storiesData[i].text + '<break time="3s"/>';
  }
  conv.ask('<speak>' + stories + '</speak>');
  conv.ask('Do you want to listen to another story?');
  conv.ask(new Suggestions('Yes', 'Tell me lot of stories', 'No thanks'));
};

// Tell new story
const tellNewStory = (conv) => {
  let i = newStoryNum(conv);
  let j = newStories[i].number;
  conv.ask('<speak>Story name: ' + storiesData[j].title + '! ' + storiesData[j].text + '</speak>');
  conv.ask('Do you want to listen to the next new story?');
  conv.ask(new Suggestions('Yes', 'No thanks'));
};

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
