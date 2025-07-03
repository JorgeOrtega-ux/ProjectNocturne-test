<?php
header('Content-Type: application/json; charset=utf-8');

/**
 * Calcula una fecha dinámica basada en una regla para un año específico.
 *
 * @param int $year El año para el cual calcular la fecha.
 * @param array $rule La regla, ej: ['first', 'monday', 5] para el primer lunes de mayo.
 * @return array|null Un array con ['month', 'day'] o null si la regla es inválida.
 */
function calculate_dynamic_date($year, $rule) {
    if (count($rule) !== 3) return null;

    list($occurrence, $dayOfWeek, $month) = $rule;
    $dayOfWeek = strtolower($dayOfWeek);

    $time = strtotime("{$occurrence} {$dayOfWeek} of " . date('F', mktime(0, 0, 0, $month, 1, $year)) . " {$year}");

    if ($time) {
        return [
            'month' => (int)date('n', $time),
            'day'   => (int)date('j', $time)
        ];
    }
    return null;
}

$year = (int)date('Y');

// === África ===
$raw_festivities_africa = [
    'EG' => [
        ['name' => 'Navidad Copta', 'month' => 1, 'day' => 7],
        ['name' => 'Día de la Revolución (2011)', 'month' => 1, 'day' => 25],
        ['name' => 'Día de la Liberación del Sinaí', 'month' => 4, 'day' => 25],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Día de la Revolución (1952)', 'month' => 7, 'day' => 23],
        ['name' => 'Día de las Fuerzas Armadas', 'month' => 10, 'day' => 6],
    ],
    'ZA' => [
        ['name' => 'Día de los Derechos Humanos', 'month' => 3, 'day' => 21],
        ['name' => 'Día de la Libertad', 'month' => 4, 'day' => 27],
        ['name' => 'Día de la Juventud', 'month' => 6, 'day' => 16],
        ['name' => 'Día Nacional de la Mujer', 'month' => 8, 'day' => 9],
        ['name' => 'Día del Patrimonio', 'month' => 9, 'day' => 24],
        ['name' => 'Día de la Reconciliación', 'month' => 12, 'day' => 16],
    ],
    'NG' => [
        ['name' => 'Día de los Trabajadores', 'month' => 5, 'day' => 1],
        ['name' => 'Día de la Democracia', 'month' => 6, 'day' => 12],
        ['name' => 'Día de la Independencia', 'month' => 10, 'day' => 1],
        ['name' => 'Navidad', 'month' => 12, 'day' => 25],
        ['name' => 'Boxing Day', 'month' => 12, 'day' => 26],
    ],
    'MA' => [
        ['name' => 'Manifiesto de la Independencia', 'month' => 1, 'day' => 11],
        ['name' => 'Fiesta del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Fiesta del Trono', 'month' => 7, 'day' => 30],
        ['name' => 'Aniversario de la Marcha Verde', 'month' => 11, 'day' => 6],
        ['name' => 'Día de la Independencia', 'month' => 11, 'day' => 18],
    ],
    'KE' => [
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Lunes de Pascua', 'rule' => ['monday', 'after', 'easter']],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Día de Madaraka', 'month' => 6, 'day' => 1],
        ['name' => 'Día de Mashujaa', 'month' => 10, 'day' => 20],
        ['name' => 'Día de Jamhuri (Independencia)', 'month' => 12, 'day' => 12],
    ],
];

// === América ===
$raw_festivities_america = [
    'US' => [
        ['name' => 'Día de Martin Luther King, Jr.', 'rule' => ['third', 'monday', 1]],
        ['name' => 'Día de los Presidentes', 'rule' => ['third', 'monday', 2]],
        ['name' => 'Día de los Caídos', 'rule' => ['last', 'monday', 5]],
        ['name' => 'Juneteenth', 'month' => 6, 'day' => 19],
        ['name' => 'Día de la Independencia', 'month' => 7, 'day' => 4],
        ['name' => 'Día del Trabajo', 'rule' => ['first', 'monday', 9]],
        ['name' => 'Día de Acción de Gracias', 'rule' => ['fourth', 'thursday', 11]],
    ],
    'BR' => [
        ['name' => 'Carnaval', 'month' => 2, 'day' => 28], // Variable
        ['name' => 'Tiradentes', 'month' => 4, 'day' => 21],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Corpus Christi', 'month' => 6, 'day' => 19], // Variable
        ['name' => 'Día de la Independencia', 'month' => 9, 'day' => 7],
        ['name' => 'Nuestra Señora de Aparecida', 'month' => 10, 'day' => 12],
        ['name' => 'Proclamación de la República', 'month' => 11, 'day' => 15],
    ],
    'MX' => [
        ['name' => 'Día de la Constitución', 'rule' => ['first', 'monday', 2]],
        ['name' => 'Natalicio de Benito Juárez', 'rule' => ['third', 'monday', 3]],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Día de la Independencia', 'month' => 9, 'day' => 16],
        ['name' => 'Día de la Revolución', 'rule' => ['third', 'monday', 11]],
        ['name' => 'Navidad', 'month' => 12, 'day' => 25],
    ],
    'AR' => [
        ['name' => 'Día Nacional de la Memoria por la Verdad y la Justicia', 'month' => 3, 'day' => 24],
        ['name' => 'Día del Veterano y de los Caídos en la Guerra de Malvinas', 'month' => 4, 'day' => 2],
        ['name' => 'Día de la Revolución de Mayo', 'month' => 5, 'day' => 25],
        ['name' => 'Paso a la Inmortalidad del Gral. Manuel Belgrano', 'month' => 6, 'day' => 20],
        ['name' => 'Día de la Independencia', 'month' => 7, 'day' => 9],
        ['name' => 'Paso a la Inmortalidad del Gral. José de San Martín', 'month' => 8, 'day' => 17],
        ['name' => 'Día del Respeto a la Diversidad Cultural', 'month' => 10, 'day' => 12],
    ],
    'CA' => [
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Día de Victoria', 'rule' => ['last', 'monday', 5]],
        ['name' => 'Día de Canadá', 'month' => 7, 'day' => 1],
        ['name' => 'Día del Trabajo', 'rule' => ['first', 'monday', 9]],
        ['name' => 'Día de Acción de Gracias', 'rule' => ['second', 'monday', 10]],
        ['name' => 'Día del Recuerdo', 'month' => 11, 'day' => 11],
    ],
];

// === Asia ===
$raw_festivities_asia = [
    'CN' => [
        ['name' => 'Año Nuevo Chino', 'month' => 2, 'day' => 10], // Variable
        ['name' => 'Festival Qingming', 'month' => 4, 'day' => 4],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Festival del Bote del Dragón', 'month' => 6, 'day' => 10], // Variable
        ['name' => 'Festival de Medio Otoño', 'month' => 9, 'day' => 17], // Variable
        ['name' => 'Día Nacional', 'month' => 10, 'day' => 1],
    ],
    'JP' => [
        ['name' => 'Día de la Mayoría de Edad', 'rule' => ['second', 'monday', 1]],
        ['name' => 'Día de la Fundación Nacional', 'month' => 2, 'day' => 11],
        ['name' => 'Día del Emperador', 'month' => 2, 'day' => 23],
        ['name' => 'Día de Showa', 'month' => 4, 'day' => 29],
        ['name' => 'Día de la Constitución', 'month' => 5, 'day' => 3],
        ['name' => 'Día del Respeto a los Mayores', 'rule' => ['third', 'monday', 9]],
        ['name' => 'Día de la Cultura', 'month' => 11, 'day' => 3],
    ],
    'IN' => [
        ['name' => 'Día de la República', 'month' => 1, 'day' => 26],
        ['name' => 'Holi', 'month' => 3, 'day' => 25], // Variable
        ['name' => 'Día de la Independencia', 'month' => 8, 'day' => 15],
        ['name' => 'Gandhi Jayanti', 'month' => 10, 'day' => 2],
        ['name' => 'Diwali', 'month' => 11, 'day' => 1], // Variable
    ],
    'KR' => [
        ['name' => 'Seollal (Año Nuevo Lunar)', 'month' => 2, 'day' => 10], // Variable
        ['name' => 'Día del Movimiento de Independencia', 'month' => 3, 'day' => 1],
        ['name' => 'Día del Niño', 'month' => 5, 'day' => 5],
        ['name' => 'Día de los Caídos', 'month' => 6, 'day' => 6],
        ['name' => 'Día de la Liberación', 'month' => 8, 'day' => 15],
        ['name' => 'Chuseok (Festival de la Cosecha)', 'month' => 9, 'day' => 17], // Variable
    ],
    'TH' => [
        ['name' => 'Día de Chakri', 'month' => 4, 'day' => 6],
        ['name' => 'Songkran (Año Nuevo Tailandés)', 'month' => 4, 'day' => 13],
        ['name' => 'Día de la Coronación', 'month' => 5, 'day' => 4],
        ['name' => 'Cumpleaños de la Reina Suthida', 'month' => 6, 'day' => 3],
        ['name' => 'Cumpleaños del Rey Vajiralongkorn', 'month' => 7, 'day' => 28],
    ],
];

// === Europa ===
$raw_festivities_europe = [
    'FR' => [
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Día de la Victoria en Europa', 'month' => 5, 'day' => 8],
        ['name' => 'Jueves de la Ascensión', 'rule' => ['sixth', 'thursday', 'after_easter']],
        ['name' => 'Fiesta Nacional de Francia', 'month' => 7, 'day' => 14],
        ['name' => 'Asunción de María', 'month' => 8, 'day' => 15],
        ['name' => 'Día de Todos los Santos', 'month' => 11, 'day' => 1],
        ['name' => 'Día del Armisticio', 'month' => 11, 'day' => 11],
    ],
    'IT' => [
        ['name' => 'Epifanía', 'month' => 1, 'day' => 6],
        ['name' => 'Lunes de Pascua', 'rule' => ['monday', 'after', 'easter']],
        ['name' => 'Día de la Liberación', 'month' => 4, 'day' => 25],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Fiesta de la República', 'month' => 6, 'day' => 2],
        ['name' => 'Ferragosto (Asunción)', 'month' => 8, 'day' => 15],
        ['name' => 'Día de Todos los Santos', 'month' => 11, 'day' => 1],
    ],
    'ES' => [
        ['name' => 'Epifanía del Señor', 'month' => 1, 'day' => 6],
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Asunción de la Virgen', 'month' => 8, 'day' => 15],
        ['name' => 'Fiesta Nacional de España', 'month' => 10, 'day' => 12],
        ['name' => 'Día de Todos los Santos', 'month' => 11, 'day' => 1],
        ['name' => 'Día de la Constitución', 'month' => 12, 'day' => 6],
    ],
    'GB' => [
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Lunes de Pascua', 'rule' => ['monday', 'after', 'easter']],
        ['name' => 'Early May Bank Holiday', 'rule' => ['first', 'monday', 5]],
        ['name' => 'Spring Bank Holiday', 'rule' => ['last', 'monday', 5]],
        ['name' => 'Summer Bank Holiday', 'rule' => ['last', 'monday', 8]],
        ['name' => 'Boxing Day', 'month' => 12, 'day' => 26],
    ],
    'DE' => [
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Lunes de Pascua', 'rule' => ['monday', 'after', 'easter']],
        ['name' => 'Día del Trabajo', 'month' => 5, 'day' => 1],
        ['name' => 'Día de la Ascensión', 'rule' => ['sixth', 'thursday', 'after_easter']],
        ['name' => 'Lunes de Pentecostés', 'rule' => ['eighth', 'monday', 'after_easter']],
        ['name' => 'Día de la Unidad Alemana', 'month' => 10, 'day' => 3],
    ],
];

// === Oceanía ===
$raw_festivities_oceania = [
    'AU' => [
        ['name' => 'Día de Australia', 'month' => 1, 'day' => 26],
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Día de Anzac', 'month' => 4, 'day' => 25],
        ['name' => 'Cumpleaños del Rey', 'rule' => ['second', 'monday', 6]],
        ['name' => 'Navidad', 'month' => 12, 'day' => 25],
        ['name' => 'Boxing Day', 'month' => 12, 'day' => 26],
    ],
    'NZ' => [
        ['name' => 'Día de Waitangi', 'month' => 2, 'day' => 6],
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Lunes de Pascua', 'rule' => ['monday', 'after', 'easter']],
        ['name' => 'Día de Anzac', 'month' => 4, 'day' => 25],
        ['name' => 'Cumpleaños del Rey', 'rule' => ['first', 'monday', 6]],
        ['name' => 'Día del Trabajo', 'rule' => ['fourth', 'monday', 10]],
    ],
    'FJ' => [
        ['name' => 'Viernes Santo', 'rule' => ['friday', 'before', 'easter']],
        ['name' => 'Sábado de Pascua', 'rule' => ['saturday', 'after', 'easter']],
        ['name' => 'Día de Ratu Sir Lala Sukuna', 'month' => 5, 'day' => 31],
        ['name' => 'Día de Fiyi', 'month' => 10, 'day' => 10],
        ['name' => 'Diwali', 'month' => 11, 'day' => 1], // Variable
    ],
    'PG' => [
        ['name' => 'Cumpleaños del Rey', 'rule' => ['second', 'monday', 6]],
        ['name' => 'Día Nacional del Recuerdo', 'month' => 7, 'day' => 23],
        ['name' => 'Día Nacional del Arrepentimiento', 'month' => 8, 'day' => 26],
        ['name' => 'Día de la Independencia', 'month' => 9, 'day' => 16],
    ],
    'WS' => [
        ['name' => 'Día de la Independencia', 'month' => 6, 'day' => 1],
        ['name' => 'Día del Padre', 'rule' => ['second', 'monday', 8]],
        ['name' => 'Día de la Madre', 'rule' => ['second', 'monday', 5]],
        ['name' => 'Lotu a Tamaiti (Día del Niño)', 'rule' => ['second', 'monday', 10]],
    ],
];

// Unificar todas las listas en una sola para el procesamiento.
$raw_festivities = array_merge(
    $raw_festivities_africa,
    $raw_festivities_america,
    $raw_festivities_asia,
    $raw_festivities_europe,
    $raw_festivities_oceania
);


// Procesar las reglas para obtener fechas concretas.
$processed_festivities = [];
foreach ($raw_festivities as $country_code => $festivals) {
    $processed_festivities[$country_code] = [];
    foreach ($festivals as $festival) {
        if (isset($festival['rule'])) {
            // Nota: La lógica para 'easter' es más compleja y no se incluye aquí.
            // Esta implementación se centra en reglas como "primer lunes de...".
            if (strpos($festival['rule'][2], 'easter') === false) {
                $dynamic_date = calculate_dynamic_date($year, $festival['rule']);
                if ($dynamic_date) {
                    $processed_festivities[$country_code][] = [
                        'name' => $festival['name'],
                        'month' => $dynamic_date['month'],
                        'day' => $dynamic_date['day']
                    ];
                }
            }
        } else {
            $processed_festivities[$country_code][] = $festival;
        }
    }
}

// Imprimir el resultado final en formato JSON.
// Se añade JSON_PRETTY_PRINT para una mejor legibilidad del output.
echo json_encode($processed_festivities, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>