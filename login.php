<?php
require_once '../includes/conexion.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);
        
    if ($email == "" || $password == "") {
        echo "Error: Todos los campos son obligatorios.";
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "El formato del correo NO es válido.";
        exit;
    }

    $sql_check = "SELECT id, nombre, email, password_hash, rol_id, activo FROM usuarios WHERE email = ? LIMIT 1";
    $stmt_check = mysqli_prepare($conexion, $sql_check);
    mysqli_stmt_bind_param($stmt_check, "s", $email);
    mysqli_stmt_execute($stmt_check);
    
    $resultado = mysqli_stmt_get_result($stmt_check);

    $usuario = mysqli_fetch_assoc($resultado); 
    
    mysqli_stmt_close($stmt_check);

    if ($usuario) {
        
        if (password_verify($password, $usuario['password_hash'])) {
            
            if ($usuario['activo'] == 0) {
                echo "Error: Su cuenta se encuentra inactiva.";
                exit;
            }

            if ($usuario['rol_id'] != 1) { 
                echo "Error: No tiene permisos de administrador para acceder a este panel.";
                exit;
            }

            echo "Login exitoso. Bienvenido " . htmlspecialchars($usuario['nombre']) . "!";

            header("Location: listado.php");     
            exit;
                                    
        } else {
            echo "Error: Error de acceso. Verifique su correo electrónico y contraseña.";
        }
        
    } else {
        echo "Error: Error de acceso. Verifique su correo electrónico y contraseña.";
    }
}
?>