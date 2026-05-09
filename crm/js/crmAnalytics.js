function getActiveProspects(){
  return CRM_STORE.prospects.filter(function(p){
    return p.current_status !== 'a_contacter';
  });
}

function computeGlobalStats(){

  const prospects = CRM_STORE.prospects;

  return {
    contactes: prospects.filter(p => p.current_status === 'contacte').length,

    rdv: prospects.filter(p => p.current_status === 'rdv_planifie').length,

    propositions: prospects.filter(p => p.current_status === 'proposition_envoyee').length,

    negociations: prospects.filter(p => p.current_status === 'negociation').length,

    signes: prospects.filter(p => p.current_status === 'signe').length,

    perdus: prospects.filter(p => p.current_status === 'perdu').length,
  };
}

function computePipeline(){

  let reliable = 0;
  let uncertain = 0;

  CRM_STORE.prospects.forEach(function(p){

    if([
      'contacte',
      'rdv_planifie',
      'proposition_envoyee',
      'negociation'
    ].includes(p.current_status)){

      const owner = CRM_STORE.users.find(u => u.email === p.owner_email);

      if(owner && owner.actif_prospection){
        reliable += Number(p.estimated_amount || 0);
      }else{
        uncertain += Number(p.estimated_amount || 0);
      }
    }
  });

  return {
    reliable,
    uncertain
  };
}

function computeConversionRate(){

  const signed = CRM_STORE.prospects.filter(p => p.current_status === 'signe').length;

  const active = getActiveProspects().length;

  if(active === 0) return 0;

  return Math.round((signed / active) * 100);
}
