var db = firebase.firestore();
firebase.firestore().enablePersistence({synchronizeTabs:true}).catch(function(err) { console.error(err); });

db.collection('stats').doc('index').get().then((doc) => {
  document.getElementById('numusers').innerHTML = doc.data().total_users;
});

db.collection('stats').doc('index').get().then((doc) => {
  document.getElementById('returningusers').innerHTML = doc.data().returning_users;
});
