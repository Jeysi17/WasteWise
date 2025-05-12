<?php
$conn = new mysqli('localhost', 'root', '', 'admin');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$filter = $_GET['filter'] ?? 'All';
$sql = "SELECT * FROM posts";
if ($filter !== 'All') {
    $sql .= " WHERE category = '$filter'";
}
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin - Posts</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootswatch@4.5.2/dist/minty/bootstrap.min.css">
    <link rel="stylesheet" href="posts.css">
</head>
<body>

<div class="header">WasteWise Admin</div>

<div id="sidebar" class="col-md-auto col-lg-2 d-md-block sidebar position-fixed">
    <button>POST</button>
    <button onclick="location.href='schedule.php'">SCHEDULES</button>
</div>

<div class="main">
    <div class="controls">
        <strong>FILTER BY:</strong>
        <form method="GET" style="display:inline;">
            <select name="filter" onchange="this.form.submit()">
                <option value="All" <?= $filter == 'All' ? 'selected' : '' ?>>All</option>
                <option value="Urgent" <?= $filter == 'Urgent' ? 'selected' : '' ?>>Urgent</option>
                <option value="Less Urgent" <?= $filter == 'Less Urgent' ? 'selected' : '' ?>>Less Urgent</option>
            </select>
        </form>
    </div>

    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Title</th>
                <th>Description</th>
                <th>Location</th>
                <th>Date</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = $result->fetch_assoc()): ?>
            <tr>
                <td>
                    <form method="POST" action="update_category.php">
                        <input type="hidden" name="id" value="<?= $row['id'] ?>">
                        <select name="category" onchange="this.form.submit()">
                            <option value="Urgent" <?= $row['category'] == 'Urgent' ? 'selected' : '' ?>>Urgent</option>
                            <option value="Less Urgent" <?= $row['category'] == 'Less Urgent' ? 'selected' : '' ?>>Less Urgent</option>
                        </select>
                    </form>
                </td>
                <td><?= htmlspecialchars($row['title']) ?></td>
                <td><?= htmlspecialchars($row['description']) ?></td>
                <td><?= htmlspecialchars($row['location']) ?></td>
                <td><?= htmlspecialchars($row['date']) ?></td>
                <td>
                    <form method="POST" action="post_action.php" style="display:inline;">
                        <input type="hidden" name="id" value="<?= $row['id'] ?>">
                        <button class="btn btn-success btn-sm" name="action" value="approve">Approve</button>
                    </form>
                    <form method="POST" action="post_action.php" style="display:inline;">
                        <input type="hidden" name="id" value="<?= $row['id'] ?>">
                        <button class="btn btn-danger btn-sm" name="action" value="decline">Decline</button>
                    </form>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
</div>

</body>
</html>
