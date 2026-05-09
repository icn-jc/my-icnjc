function getISOWeek(date = new Date()) {
  const tmp = new Date(date.valueOf());

  const dayNum = (date.getDay() + 6) % 7;

  tmp.setDate(tmp.getDate() - dayNum + 3);

  const firstThursday = tmp.valueOf();

  tmp.setMonth(0,1);

  if(tmp.getDay() !== 4){
    tmp.setMonth(0,1 + ((4 - tmp.getDay()) + 7) % 7);
  }

  return 1 + Math.ceil((firstThursday - tmp) / 604800000);
}

function setCurrentWeek(){
  const now = new Date();

  CRM_STORE.selectedWeek = getISOWeek(now);
  CRM_STORE.selectedYear = now.getFullYear();
}

function nextWeek(){
  CRM_STORE.selectedWeek++;
  refreshCRM();
}

function previousWeek(){
  CRM_STORE.selectedWeek--;
  refreshCRM();
}
