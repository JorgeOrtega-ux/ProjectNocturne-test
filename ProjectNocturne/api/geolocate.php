<?php
// Encabezado para asegurar que la respuesta sea tratada como JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permite peticiones desde cualquier origen, ajusta si es necesario por seguridad.

// La URL base de la API de geolocalización
$apiUrl = 'http://ip-api.com/json';

// --- FUTURA IMPLEMENTACIÓN DE API KEY ---
// Si en el futuro tienes una clave de API, descomenta y modifica estas líneas.
// Por ejemplo, para el servicio pro de ip-api.com:
/*
$apiKey = 'TU_FUTURA_API_KEY';
$apiUrl = 'http://pro.ip-api.com/json/?key=' . $apiKey;
*/
// --- FIN DE LA IMPLEMENTACIÓN DE API KEY ---

// Inicializar cURL
$ch = curl_init();

// Configurar las opciones de cURL
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // Tiempo de espera para la conexión
curl_setopt($ch, CURLOPT_TIMEOUT, 10);      // Tiempo de espera total para la petición

// Ejecutar la petición
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

// Cerrar cURL
curl_close($ch);

// Verificar si hubo un error en la petición cURL
if ($error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'fail',
        'message' => 'Error fetching geolocation data: ' . $error
    ]);
    exit;
}

// Verificar si el código de respuesta de la API no es 200 (OK)
if ($httpcode != 200) {
    http_response_code($httpcode);
    echo json_encode([
        'status' => 'fail',
        'message' => 'Geolocation API returned non-200 status code.',
        'api_response' => $response
    ]);
    exit;
}

// Si todo salió bien, simplemente pasamos la respuesta de la API al cliente
echo $response;
?>