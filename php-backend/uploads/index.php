<?php
// Mencegah akses langsung ke direktori uploads
http_response_code(403);
echo json_encode([
    'success' => false,
    'message' => 'Akses langsung ke direktori penyimpanan diblokir demi keamanan.'
]);
exit;
