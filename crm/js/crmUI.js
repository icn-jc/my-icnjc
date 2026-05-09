function refreshCRM(){

  renderStats();
  renderPipeline();
  renderProspectsTable();
}

function renderStats(){

  const stats = computeGlobalStats();

  document.getElementById('stat-contactes').innerText = stats.contactes;
  document.getElementById('stat-rdv').innerText = stats.rdv;
  document.getElementById('stat-propositions').innerText = stats.propositions;
  document.getElementById('stat-negociations').innerText = stats.negociations;
  document.getElementById('stat-signes').innerText = stats.signes;
  document.getElementById('stat-perdus').innerText = stats.perdus;
}

function renderPipeline(){

  const pipeline = computePipeline();

  document.getElementById('pipeline-reliable').innerText = formatCurrency(pipeline.reliable);

  document.getElementById('pipeline-uncertain').innerText = formatCurrency(pipeline.uncertain);

  document.getElementById('conversion-rate').innerText = computeConversionRate() + '%';
}

function renderProspectsTable(){

  const container = document.getElementById('prospects-table');

  if(!container) return;

  container.innerHTML = CRM_STORE.prospects.map(function(p){

    return `
      <tr>
        <td>${p.company_name}</td>
        <td>${CRM_STATUS_LABELS[p.current_status] || '-'}</td>
        <td>${formatCurrency(p.estimated_amount)}</td>
        <td>${p.owner_name || '-'}</td>
        <td>${formatDate(p.updated_at)}</td>
      </tr>
    `;

  }).join('');
}
