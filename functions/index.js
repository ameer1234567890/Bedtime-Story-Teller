'use strict';

const {
  dialogflow,
  Suggestions,
} = require('actions-on-google');

const functions = require('firebase-functions');
const storiesData = require('./stories.js');
const app = dialogflow({debug: false});
const doYouWantAnother = 'Do you want to listen to another story?';
const doYouWantAnotherSuggestions = new Suggestions('Yes', 'No', 'Tell me lot of stories');

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

// Handle 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  let random = Math.floor(Math.random() * welcomeMessages.length);
  conv.ask(welcomeMessages[random].text + ' Please say, tell me a story, to start listening stories.');
  conv.ask(doYouWantAnotherSuggestions);
});

// When 'Tell me a story' is said after the welcome intent or When 'yes' is answered
app.intent(['Default Welcome Intent - start', 'stories intent - yes'], (conv) => {
  tellStory(conv);
});

// When 'continuous mode' is said after the welcome intent, or later
app.intent(['Default Welcome Intent - continuous', 'stories intent - continuous'], (conv) => {
  tellStoriesContinuous(conv);
});

// When there is no response
app.intent('actions_intent_NO_INPUT', (conv) => {
  // Use the number of reprompts to vary response
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask(doYouWantAnother);
  } else if (repromptCount === 1) {
    conv.ask(doYouWantAnother);
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close('OK! I got no response! Good bye!');
  }
});

// Tell the actual story
const tellStory = (conv) => {
  let i = randomStoryNum(conv);
  conv.ask('<speak>Story name: ' + storiesData[i].title + '! ' + storiesData[i].text + '</speak>');
  conv.ask(doYouWantAnother);
  conv.ask(doYouWantAnotherSuggestions);
};

// Tell the stories in continuous mode
const tellStoriesContinuous = (conv) => {
  let stories = '';
  for (let j = 0; j < 5; j++) {
    let i = randomStoryNum(conv);
    stories += 'Story name: ' + storiesData[i].title + '! ' + storiesData[i].text + '<break time="3s"/>';
  }
  conv.ask('<speak>' + stories + '</speak>');
  conv.ask(doYouWantAnother);
  conv.ask(doYouWantAnotherSuggestions);
};

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
