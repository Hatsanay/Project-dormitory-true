const db = require("../config/db");
require("dotenv").config();

//////////////API//////////////
//////////registerPermission/////////
////////////////////////////////////
const registerRenting = async (req, res) => {
  const { renting_user_ID, renting_room_ID} = req.body;

  try {
    const query = "SELECT renting_ID FROM renting ORDER BY renting_ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId;
    if (result.length === 0) {
      maxId = 0;
    } else {
      const lastRentingId = result[0].renting_ID;
      maxId = parseInt(lastRentingId.slice(-6)) || 0;
    }
    const num = maxId + 1;
    const newRentingID = "REN" + String(num).padStart(6, "0");
    const renting_stat_ID = "STA000009"
    const insertQuery = `
      INSERT INTO renting
      ( renting_ID, renting_user_ID,renting_room_ID,renting_stat_ID)
      VALUES (?, ?, ?, ?)
    `;
    await db.promise().query(insertQuery, [newRentingID, renting_user_ID,renting_room_ID,renting_stat_ID]);

    res.status(201).json({ message: "ลงทะเบียนการเช่าสำเร็จแล้ว!" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
///////////getAutotid///////////
///////////////////////////////
const getAutoRentingID = async (req, res) => {
  try {
    const query = "SELECT renting_ID FROM renting ORDER BY renting_ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId;
    if (result.length === 0) {
      maxId = 0;
    } else {
      const lastRentingId = result[0].renting_ID;
      maxId = parseInt(lastRentingId.slice(-6)) || 0;
    }
    const num = maxId + 1;
    const newRentingID = "REN" + String(num).padStart(6, "0");
    res.status(200).json(newRentingID);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
///////////getRenting/////////////
///////////////////////////////
const getRenting = async (req, res) => {
  try {
    const query = `
    SELECT 
      renting_ID, 
      CONCAT(users.user_Fname,' ', users.user_Lname) AS userName,
      room.room_Number,
      status.stat_Name,
      renting_user_ID,
      renting_room_ID,
      renting_stat_ID
    FROM 
      renting
    INNER JOIN users on users.user_ID = renting.renting_user_ID
    INNER JOIN room on room.room_ID = renting.renting_room_ID
    INNER JOIN status on status.stat_ID = renting.renting_stat_ID
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
///////getgetRentingByID/////////////
///////////////////////////////
const getgetRentingByID = async (req, res) => {
  try {
    const renting_ID = req.query.ID;
    if (!renting_ID) {
      return res.status(400).json({ error: "โปรดระบุ ID การเช่า" });
    }
    const query = `
      SELECT 
      renting_ID, 
      CONCAT(users.user_Fname,' ', users.user_Lname) AS userName,
      room.room_Number,
      status.stat_Name,
      renting_user_ID,
      renting_room_ID,
      renting_stat_ID
    FROM 
      renting
    INNER JOIN users on users.user_ID = renting.renting_user_ID
    INNER JOIN room on room.room_ID = renting.renting_room_ID
    INNER JOIN status on status.stat_ID = renting.renting_stat_ID
    WHERE 
      renting_ID = ?
    `;
    const [result] = await db.promise().query(query, [renting_ID]);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการเช่า" });
    }
    res.status(200).json(result[0]);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getUserForRenting = async (req, res) => {
  try {
    const query = `
    SELECT 
      user_ID,
      CONCAT(users.user_Fname,' ', users.user_Lname) AS userName
    FROM 
      users
    WHERE user_status_ID = "STA000003"
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getRoomForRenting = async (req, res) => {
  try {
    const query = `SELECT
      room_ID, 
      room_Number
    FROM
      room
    WHERE room_Status_ID = "STA000006"
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};


//////////////API//////////////
//////////updatePermission///////////
///////////////////////////////
const updatePermission = async (req, res) => {
  const permission_id= req.query.ID;
  const { newPermissionName } = req.body;

  try {
    if (!permission_id) {
      return res.status(400).json({ error: "โปรดระบุIDสิทธิ์" });
    }
    const [permissionCheck] = await db.promise().query("SELECT * FROM permissions WHERE permission_name = ?", [permission_id]);
    if (permissionCheck.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลสิทธิ์" });
    }

    const updateQuery = `
      UPDATE permissions SET
        permission_name = ?
      WHERE permission_id = ?
    `;
    await db.promise().query(updateQuery, [newPermissionName, permission_id]);
    res.status(200).json({ message: "อัปเดตข้อมูลสิทธิ์เรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

module.exports = {
  getRenting,
  getgetRentingByID,
  registerRenting,
  getAutoRentingID,
  getUserForRenting,
  getRoomForRenting
};
