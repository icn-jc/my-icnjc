async function loadProspectTimeline(prospectId){

  const snap = await COLLECTIONS.prospects
    .doc(prospectId)
    .collection('actions')
    .orderBy('created_at','desc')
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
