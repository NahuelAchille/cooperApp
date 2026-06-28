document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('registerForm')

  form.addEventListener('submit', function(e) {

    const password = document.getElementById('contraseña').value;
    const confirmPass = document.getElementById('confirmar_contraseña').value

    if (password !== confirmPass) {
      e.preventDefault()
      alert('Las contraseñas no coinciden')
    }

  })

})
