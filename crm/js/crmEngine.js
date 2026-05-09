async function loadUsers(){

  const snap = await COLLECTIONS.users.get();

  CRM_STORE.users = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function loadProspects(){

  const snap = await COLLECTIONS.prospects.orderBy('updated_at','desc').get();

  CRM_STORE.prospects = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function createProspect(data){

  const ref = COLLECTIONS.prospects.doc();

  await ref.set({
    company_name: data.company_name,

    owner_email: CURRENT_USER.email,

    owner_name: CURRENT_PROFILE.prenom + ' ' + CURRENT_PROFILE.nom,

    current_status: data.current_status,

    estimated_amount: Number(data.estimated_amount || 0),

    secteur: safe(data.secteur),

    priority: safe(data.priority, 'medium'),

    archived: false,

    created_at: nowTimestamp(),

    updated_at: nowTimestamp(),

    last_action_at: nowTimestamp(),

    contact_person: {
      nom: safe(data.contact_name),
      poste: safe(data.contact_role),
      email: safe(data.contact_email),
      phone: safe(data.contact_phone)
    }
  });

  await addAction(ref.id, {
    type: data.current_status,
    note: 'Création du prospect'
  });

  await loadProspects();

  refreshCRM();
}

async function addAction(prospectId, actionData){

  const ref = COLLECTIONS.prospects
    .doc(prospectId)
    .collection('actions')
    .doc();

  await ref.set({
    type: actionData.type,

    note: safe(actionData.note),

    rdv_date: actionData.rdv_date || null,

    estimated_amount: Number(actionData.estimated_amount || 0),

    created_by: CURRENT_USER.email,

    created_at: nowTimestamp()
  });

  await syncProspectStatus(prospectId, actionData);
}

async function syncProspectStatus(prospectId, actionData){

  let status = null;

  switch(actionData.type){

    case 'contacte':
      status = 'contacte';
      break;

    case 'rdv_planifie':
      status = 'rdv_planifie';
      break;

    case 'proposition_envoyee':
      status = 'proposition_envoyee';
      break;

    case 'negociation':
      status = 'negociation';
      break;

    case 'signe':
      status = 'signe';
      break;

    case 'perdu':
      status = 'perdu';
      break;
  }

  if(!status) return;

  await COLLECTIONS.prospects.doc(prospectId).update({
    current_status: status,
    updated_at: nowTimestamp(),
    last_action_at: nowTimestamp(),
    estimated_amount: Number(actionData.estimated_amount || 0)
  });
}
