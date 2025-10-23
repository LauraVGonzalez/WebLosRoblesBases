const fetch = require('node-fetch');

async function testRegister() {
  const res = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      primer_nombre: 'Sara',
      segundo_nombre: 'Valentina',
      primer_apellido: 'Gonzalez',
      segundo_apellido: 'Tulcan',
      correo: 'sara@gmail.com',
      password: '12345678',
      telefono: '3235225122'
    })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

testRegister();
