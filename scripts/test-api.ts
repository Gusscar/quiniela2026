const API_KEY = 'wc26_7RFGrTn6CbSwg9ChqpeZxD';

async function test() {
  const res = await fetch('https://api.wc2026api.com/teams', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  console.log('Primer team:', JSON.stringify(data[0], null, 2));
  
  const res2 = await fetch('https://api.wc2026api.com/matches?round=group', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data2 = await res2.json();
  console.log('\nPrimer match:', JSON.stringify(data2[0], null, 2));
}

test();
