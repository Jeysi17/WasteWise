<?php
$conn = new mysqli('localhost', 'root', '', 'admin');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$id = $_POST['id'];
$category = $_POST['category'];

$stmt = $conn->prepare("UPDATE posts SET category = ? WHERE id = ?");
$stmt->bind_param("si", $category, $id);
$stmt->execute();
$stmt->close();
$conn->close();

header("Location: post.php");
exit();
