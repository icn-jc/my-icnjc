function formatCurrency(amount){
  return new Intl.NumberFormat('fr-FR', {
    style:'currency',
    currency:'EUR',
    maximumFractionDigits:0
  }).format(amount || 0);
}

function formatDate(date){
  if(!date) return '-';

  const d = date.toDate ? date.toDate() : new Date(date);

  return d.toLocaleDateString('fr-FR');
}

function uid(){
  return Math.random().toString(36).substring(2,10);
}

function nowTimestamp(){
  return firebase.firestore.FieldValue.serverTimestamp();
}

function safe(val, fallback=''){
  return val || fallback;
}
