const db = require("../config/db");
require("dotenv").config();

//////////////API//////////////
//////////registerRoom/////////
///////////////////////////////
const registerRoom = async (req, res) => {
  const {
    roomnumber
  } = req.body;

  try {
    ////////////Autoid/////////////
    const query = "SELECT room_ID FROM room ORDER BY room_ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId;
    if (result.length === 0) {
      maxId = 0;
    } else {
      const lastRoomId = result[0].room_ID;
      maxId = parseInt(lastRoomId.slice(-6)) || 0;
    }
    const num = maxId + 1;
    const roomID = "ROM" + String(num).padStart(6, "0");

    const Roomchecked = await checkRoom(roomnumber);
    if (Roomchecked) {
      return res.status(400).json({ error: "มีเลขห้องนี้อยู่แล้ว" });
    }
    const room_stat_ID= "STA000007";
    const room_status_ID= "STA000006";
    ///////บันทึกลงฐานข้อมูล//////////
    const insertQuery = `
      INSERT INTO room
      (room_ID, room_Number, room_stat_ID,room_status_ID)
      VALUES (?, ?, ?,?)
    `;
    await db
      .promise()
      .query(insertQuery, [
        roomID,
        roomnumber,
        room_stat_ID,
        room_status_ID
      ]);

    res.status(201).json({ message: "ลงทะเบียนห้องพักเรียบร้อยแล้ว!" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

///////////function/////////////
////////////////////////////////
async function checkRoom(roomnumber) {
  try {
    const query = "SELECT COUNT(*) as count FROM room WHERE room_Number = ?";
    const [rows] = await db.promise().query(query, [roomnumber]);
    return rows[0].count > 0;
  } catch (err) {
    console.error("ไม่สามารถตรวจสอบ room_Numberได้:", err);
    throw err;
  }
}

//////////////API//////////////
///////////getAutotid///////////
///////////////////////////////
const getAutotidRoom = async (req, res) => {
  try {
    const query = "SELECT room_ID FROM room ORDER BY room_ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId;
    if (result.length === 0) {
      maxId = 0;
    } else {
      const lastRoomId = result[0].room_ID;
      maxId = parseInt(lastRoomId.slice(-6)) || 0;
    }
    const num = maxId + 1;
    const roomID = "ROM" + String(num).padStart(6, "0");
    res.status(200).json(roomID);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API/////////////
/////////getRoom//////////////
///////////////////////////////
const getRoom = async (req, res) => {
  try {
    const query = `SELECT
      room_ID, 
      room_Number, 
      status.stat_Name ,
      sta.stat_Name AS status,
      room.room_status_ID 
    FROM
      room
    INNER JOIN
      status ON room.room_stat_ID = status.stat_ID
    INNER JOIN
      status sta ON room.room_status_ID = sta.stat_ID
    WHERE room_status_ID = "STA000006"
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
///////getRoomByNumber/////////
///////////////////////////////
const getRoomByNumber = async (req, res) => {
  try {
    const roomID = req.query.ID;
    if (!roomID) {
      return res.status(400).json({ error: "โปรดระบุเลข ID" });
    }
    const query = ` 
      SELECT
        room_ID, 
        room_Number, 
        room_stat_ID,
        room_status_ID
      FROM
        room
      WHERE
        room_ID = ?
    `;
    const [result] = await db.promise().query(query, [roomID]);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลห้องพัก" });
    }
    res.status(200).json(result[0]);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
//////////updateRoom///////////
///////////////////////////////
const updateRoom = async (req, res) => {
  const roomID = req.query.ID;
  const { roomnumber } = req.body;

  try {
    if (!roomID) {
      return res.status(400).json({ error: "โปรดระบุ roomID" });
    }
    const [userCheck] = await db.promise().query("SELECT * FROM room WHERE room_ID = ?", [roomID]);
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลห้อง" });
    }
    const Roomchecked = await checkRoom(roomnumber);
    if (Roomchecked) {
      return res.status(400).json({ error: "มีเลขห้องนี้อยู่แล้ว" });
    }
    const updateQuery = `
      UPDATE room SET
        room_Number = ? 
      WHERE room_ID = ?
    `;
    await db.promise().query(updateQuery, [roomnumber,roomID]);
    res.status(200).json({ message: "อัปเดตข้อมูลห้องพักเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
///////updateRoomStatus////////
///////////////////////////////
const updateRoomStatus = async (req, res) => {
  const { roomID, room_status_ID } = req.body;

  try {
    if (!roomID || !room_status_ID) {
      return res.status(400).json({ error: "กรุณาระบุ roomID และ room_stat_ID" });
    }
    const [userCheck] = await db.promise().query("SELECT * FROM room WHERE room_ID = ?", [roomID]);
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลห้องพัก" });
    }

    const updateQuery = "UPDATE room SET room_status_ID = ? WHERE room_ID = ?";
    await db.promise().query(updateQuery, [room_status_ID, roomID]);

    res.status(200).json({ message: "อัปเดตสถานะของห้องพักเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

//////////////API//////////////
//////////getStatusRoom////////
///////////////////////////////
const getStatusRoom = async (req, res) => {
  try {
    const query = 'SELECT stat_ID,stat_Name FROM status WHERE stat_StatTypID = "STT000003"';
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getStatusRoomDelete = async (req, res) => {
  try {
    const query = 'SELECT * FROM status WHERE stat_StatTypID = "STT000002"';
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

module.exports = {
  registerRoom,
  getAutotidRoom,
  getRoom,
  getRoomByNumber,
  updateRoom,
  updateRoomStatus,
  getStatusRoom,
  getStatusRoomDelete
};
