<?php
$conn = new mysqli('localhost', 'root', '', 'admin');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$id = $_POST['id'];
$action = $_POST['action'];

if ($action == 'approve') {
    // Example logic: mark as approved
    $stmt = $conn->prepare("UPDATE posts SET status = 'approved' WHERE id = ?");
} elseif ($action == 'decline') {
    // Or delete post
    $stmt = $conn->prepare("DELETE FROM posts WHERE id = ?");
}
$stmt->bind_param("i", $id);
$stmt->execute();
$stmt->close();
$conn->close();

header("Location: post.php");
exit();
