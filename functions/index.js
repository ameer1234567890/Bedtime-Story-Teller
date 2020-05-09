'use strict';
/* jshint esversion: 6 */
/* jshint node: true */

const {
  dialogflow,
  Suggestions,
  MediaObject,
  Image,
} = require('actions-on-google');

const functions = require('firebase-functions');
const storiesData = require('./stories.js');
const app = dialogflow({debug: false});
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const { v4: uuidv4 } = require('uuid');

// Some alternative welcome messages
const welcomeMessages = [
  {text: 'Hi! Welcome to Bedtime Story Teller.',},
  {text: 'Hi! It\'s story time.',},
  {text: 'Hi! It\'s time for some stories.',},
  {text: 'Hi! let\'s get started with bedtime stories.',},
];

// Some alternative messages for returning users
const returningMessages = [
  {text: 'Good to have you back.',},
  {text: 'It\'s been some time since we last met.',},
  {text: 'It\'s been a pleasure having you back.',},
  {text: 'Welcome back, by the way.',},
];

// List denoting new story numbers
const newStories = [
  {number: 49,},
  {number: 50,},
  {number: 51,},
];

// All stories in different randomizations
const allStories = [
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_0.mp3?alt=media&token=4cafb323-91c4-48d0-8c7c-86cf0323a7a4',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_1.mp3?alt=media&token=f7172d25-aac1-46b5-bb67-8a3a086932a4',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_2.mp3?alt=media&token=44b06774-356f-490b-872b-e8dee7ae0c9d',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_3.mp3?alt=media&token=56f19b6f-0223-4073-a18a-60fae1d5034b',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_4.mp3?alt=media&token=6b2b5218-b94c-430e-9890-25e84ec7bd11',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_5.mp3?alt=media&token=74b291c2-aaae-46c4-801f-7ae182c298a5',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_6.mp3?alt=media&token=33c35278-86c8-42a5-9efc-6b21b13a05e6',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_7.mp3?alt=media&token=0915beee-864a-4e41-8b64-4f409b629d18',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_8.mp3?alt=media&token=ea225753-30cf-450b-a96a-412e59563e72',},
  {url: 'https://firebasestorage.googleapis.com/v0/b/bedtime-story-teller-290ad.appspot.com/o/all_stories_9.mp3?alt=media&token=e9f7536f-2419-454c-bee7-0000ea50cac6',},
];

// Random number generator for stories
const genRandom = () => {
  return Math.floor(Math.random() * storiesData.length);
};

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
      /* jshint -W083 */
      found = listenedStories.find((element) => { // eslint-disable-line no-loop-func
      /* jshint +W083 */
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
    db.collection('stats').doc('index').update({ total_users: admin.firestore.FieldValue.increment(1) })
    .then(() => { return console.log('Stats updated!'); })
    .catch((error) => { return console.error('Error updating stats: ', error); });
    conv.user.storage.uid = uid;
  } else if (conv.user.verification === 'VERIFIED' && conv.user.storage.uid) {
    let uid = conv.user.storage.uid;
    let date = new Date();
    db.collection('users').doc(uid).update({ last_accessed: date })
    .then(() => { return console.log('Saved last_accessed token!'); })
    .catch((error) => { return console.error('Error writing last_accessed token: ', error); });
    let returningUser = false;
    db.collection('users').doc(uid).get()
    .then((doc) => {
      if (! doc.last_accessed) {
        returningUser = true;
      }
      return true;
    })
    .catch((error) => { return console.error('Error getting record: ', error); });
    conv.user.storage.last_accessed = date;
    if (returningUser) {
      db.collection('stats').doc('index').update({ returning_users: admin.firestore.FieldValue.increment(1) })
      .then(() => { return console.log('Stats updated!'); })
      .catch((error) => { return console.error('Error updating stats: ', error); });
    }
  }
  let random = Math.floor(Math.random() * welcomeMessages.length);
  let welcomeMessage = welcomeMessages[random].text;
  if (conv.user.last.seen) {
    let random = Math.floor(Math.random() * returningMessages.length);
    welcomeMessage = welcomeMessage + ' ' + returningMessages[random].text;
  }
  conv.ask(welcomeMessage + ' Please say "tell me a story" to start listening stories. ' +
           'You can also say "tell me lot of stories" to listen to stories without interruption.');
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

// Handle media intents
app.intent('actions_intent_MEDIA_STATUS', (conv) => {
  const mediaStatus = conv.arguments.get('MEDIA_STATUS');
  if (mediaStatus && mediaStatus.status === 'FINISHED') {
    // Right after playing all stories (MediaResponse)
    conv.ask('Hope you enjoyed the stories! Do you want to listen to another story?');
    conv.ask(new Suggestions('Yes', 'Tell me lot of stories', 'No thanks'));
  } else {
    conv.ask('Okay! Do you want to listen to another story?');
    conv.ask(new Suggestions('Yes', 'Tell me lot of stories', 'No thanks'));
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
  let random = Math.floor(Math.random() * allStories.length);
  conv.ask('I am playing all stories.');
  conv.ask(new MediaObject({
    name: 'Bedtime Story Teller - All Stories',
    url: allStories[random].url,
    description: stories,
    icon: new Image({
      url: 'https://lh3.googleusercontent.com/nJMB2ZVPQgo9GYLjWfs18oajhppikyKDNIedcr0jqF_jD54i8t22i7L4VBqoDZWYjGm0KsM0F-OP=s72',
      alt: 'Icon',
    }),
  }));
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
