const loginForm = document.getElementById("loginForm")
const alertContainer = document.getElementById("alert-container")

fetch('/users/check-session')
    .then(res => { if (res.ok) window.location.href = '/views/dashboard.html' })
    .catch(() => {})

    
loginForm.onsubmit = async (e) => {

    e.preventDefault()

    const email = loginForm.querySelector('#email').value
    const password = loginForm.querySelector('#password').value

    if(!email || !password){
        alertContainer.textContent = 'Todos los datos son requeridos.'
        alertContainer.classList.remove('d-none', 'alert-success')
        alertContainer.classList.add('alert-danger')
        return

    } else {

        try {
            const response = await fetch('/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (response.ok) {
                window.location.href = '/views/dashboard.html'

            } else {
                alertContainer.textContent = data.error || 'Error al iniciar sesión'
                alertContainer.classList.remove('d-none', 'alert-success')
                alertContainer.classList.add('alert-danger')

            }

        } catch (error) {
            console.error('Error:', error)
        }

    }

}