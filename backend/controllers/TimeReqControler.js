const db = require("../config/db");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

const getreqtime = async (req, res) => {
  try {
    const query = `SELECT 
      schedulerepairs.ID as schedulerepairsID,
      schedulerepairs.Date AS Date,
      schedulerepairs.startTime AS startTime,
      schedulerepairs.endTime AS endTime,
      sdr_mainr_ID,
      requisition.requisition_ID AS requisition_ID,
      room.room_Number AS room,
      GROUP_CONCAT(users.user_Fname, ' ', users.user_Lname) AS technicians
    FROM  
      schedulerepairs
      INNER JOIN maintenancerequests on maintenancerequests.mainr_ID = schedulerepairs.sdr_mainr_ID
      INNER JOIN status ms on ms.stat_ID = maintenancerequests.mainr_Stat_ID
      INNER JOIN requisition on requisition.requisition_mainr_ID = maintenancerequests.mainr_ID
      INNER JOIN renting on renting.renting_ID = maintenancerequests.mainr_renting_ID
      INNER JOIN room on room.room_ID = renting.renting_room_ID
      INNER JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID
      INNER JOIN users ON users.user_ID = scheculerepairsn_list.srl_user_ID
    GROUP BY schedulerepairs.ID`;

    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }

    // ฟอร์แมตข้อมูลวันที่และเวลา (จัดการ timezone)
    const formattedResult = result.map((item) => {
      const date = new Date(item.Date);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

      const formattedDate = date.toISOString().split("T")[0]; // แปลงเป็น YYYY-MM-DD
      const formattedStartTime = item.startTime.slice(0, 5); // ตัดให้เหลือเฉพาะ HH:mm
      const formattedEndTime = item.endTime.slice(0, 5); // ตัดให้เหลือเฉพาะ HH:mm

      return {
        ...item,
        Date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        technicians: item.technicians ? item.technicians.split(",") : [], // แปลง technicians string เป็น array
      };
    });

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getMacForShc = async (req, res) => {
  try {
    const query = `SELECT 
    user_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname
  FROM 
    users
  WHERE
    user_Role_ID = "ROL000003"
      AND user_Status_ID = "STA000003"`;

    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};


const getReqwaitForShc = async (req, res) => {
  try {

    const query = `
    SELECT
      mainr_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
      room.room_Number AS roomNumber,
      mainr_ProblemTitle,
      mainr_ProblemDescription,
      mainr_Date,
      petitiontype.Type AS Type,
      status.stat_Name AS status
    FROM 
      maintenancerequests
        INNER JOIN renting on renting.renting_ID = maintenancerequests.mainr_renting_ID
        INNER JOIN users on users.user_ID = renting.renting_user_ID
        INNER JOIN petitiontype on petitiontype.ID = mainr_pattyp_ID
        INNER JOIN status on status.stat_ID = maintenancerequests.mainr_Stat_ID
        INNER JOIN room on room.room_ID = renting.renting_room_ID
    WHERE
        maintenancerequests.mainr_Stat_ID = "STA000013"
    ORDER BY
      maintenancerequests.mainr_ID ASC
    `;

    const [result] = await db.promise().query(query,);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      mainr_Date:
        new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const assignWork = async (req, res) => {
  try {
    const { repairID, technician, assistants, date, startTime, endTime } = req.body;

    const query = "SELECT ID FROM schedulerepairs ORDER BY ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId;
    if (result.length === 0) {
      maxId = 0; // กรณีที่ยังไม่มีข้อมูลในตาราง
    } else {
      const lastScheduleId = result[0].ID; // รหัสแถวสุดท้าย
      maxId = parseInt(lastScheduleId.slice(-6)) || 0; // แปลงสตริงให้เป็นเลข 6 หลักสุดท้าย
    }
    const num = maxId + 1; // เพิ่มค่า ID ที่ได้มาอีก 1
    const scheduleID = "SCH" + String(num).padStart(6, "0"); // เติมเลข 0 ด้านหน้าให้ครบ 6 หลัก

    const insertScheduleQuery = `
      INSERT INTO schedulerepairs (ID, Date, startTime, endTime, sdr_mainr_ID)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.promise().query(insertScheduleQuery, [scheduleID, date, startTime, endTime, repairID]);

    const insertTechnicianQuery = `
      INSERT INTO scheculerepairsn_list (Order_MN, srl_sdr_ID, srl_user_ID)
      VALUES (?, ?, ?)
    `;

    await db.promise().query(insertTechnicianQuery, [1, scheduleID, technician]);

    for (let i = 0; i < assistants.length; i++) {
      await db.promise().query(insertTechnicianQuery, [i + 2, scheduleID, assistants[i]]);
    }

    const updateStatusQuery = `
      UPDATE maintenancerequests
      SET mainr_Stat_ID = 'STA000014'
      WHERE mainr_ID = ?
    `;
    await db.promise().query(updateStatusQuery, [repairID]);

    res.status(201).json({ message: "การมอบหมายงานสำเร็จ" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  }
};



module.exports = { getreqtime,getMacForShc,getReqwaitForShc,assignWork };
