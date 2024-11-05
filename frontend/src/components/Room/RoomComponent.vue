<template>
  <div>
    <WidgetsStatsD class="mb-4" />
    <CRow>
      <CCol :md="12">
        <CCard class="mb-4">
          <CCardHeader>จัดการห้องพัก</CCardHeader>
          <CCardBody>
            <CForm class="row g-2 needs-validation"
              novalidate
              @submit="handleSubmitTooltip01"
              >
              <CCol md="12">
                <CRow class="mb-3">
                  <CCol md="2">
                  <CFormLabel for="resRoomID" class="">รหัสห้องพัก</CFormLabel>
                  <CFormInput  v-model="autoID" type="text" id="resRoomID" disabled />
                </CCol>
                <CCol md="5">
                    <CFormLabel for="resRoom_Number">เลขห้อง</CFormLabel>
                    <CFormInput
                      v-model="resRoom_Number"
                      type="text"
                      id="resRoom_Number"
                      required
                      :class="{ 'is-invalid': isRoomInvalid }"
                    />
                    <CFormFeedback invalid>
                      {{ RoomErrorMessage }}
                    </CFormFeedback>
                  </CCol>
                   <CCol md="3">
                    <CFormLabel for="resStatus">สถานะห้องพัก</CFormLabel>
                      <CFormInput 
                          type="text" 
                          v-model="resStatus" 
                          id="resStatus" 
                          placeholder="กรุณาเลือกสถานะห้องพัก" 
                          disabled 
                      />
                     <!-- <CFormSelect v-model="resStatus" id="resStatus"  required >
                        <option disabled >กรุณาเลือกสถานะห้องพัก</option>
                    </CFormSelect>-->
                  </CCol>
                </CRow>
                <CFormInput v-if="visable" v-model="token" type="text" id="token" />
              </CCol>
              <CButton type="submit" color="primary" class="">บันทึก</CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CToaster class="p-3" placement="top-end">
      <CToast v-for="(toast, index) in toasts" :key="index" visible>
        <CToastHeader closeButton>
          <span class="me-auto fw-bold">{{ toast.title }}</span>
        </CToastHeader>
        <CToastBody>{{ toast.content }}</CToastBody>
      </CToast>
    </CToaster>
  </div>
</template>

<script>
import { ref, computed, onMounted} from "vue";
import axios from "axios";
import "@vuepic/vue-datepicker/dist/main.css";

export default {
  name: "RoomComponent",
  // computed: {
  //   userPermissions() {
  //     return JSON.parse(localStorage.getItem("permissions")) || [];
  //   },
  // },
  setup() {
    const autoID = ref("");
    const resRoom_Number = ref("");
    const validatedTooltip01 = ref(false);
    const toasts = ref([]);
    const resStatus = ref("ว่าง");
    const isRoomInvalid = computed(() => {
      return (
        validatedTooltip01.value &&
        (resRoom_Number.value.trim() === "" || !/^\d{3}$/.test(resRoom_Number.value))
      );
    });

    const RoomErrorMessage = computed(() => {
      if (resRoom_Number.value.trim() === "") {
        return "กรุณากรอกเลขห้อง";
      } else if (!/^\d{3}$/.test(resRoom_Number.value)) {
        return "กรุณากรอกเลขห้องให้ถูกต้อง (3 หลัก)";
      }
      return "";
    });

    const handleSubmitTooltip01 = (event) => {
      validatedTooltip01.value = true;
      
      if (
        isRoomInvalid.value 
      ) {
        event.preventDefault();
        event.stopPropagation();
      }else {
        handleSubmit();
      }
    };

    const handleSubmit = async () => {
      try {
        // ส่งข้อมูลลงทะเบียนห้องพักไปยังเซิร์ฟเวอร์
        const response = await axios.post("/api/auth/registerRoom", {
        roomnumber   : resRoom_Number.value,

        userPost      : "USE000001",
        RoomStatus_ID : "STA000007",
        });

        // แสดงข้อความสำเร็จ
        createToast("Success", response.data.message);

        // หน่วงเวลา 1 วินาที (1000 มิลลิวินาที) ก่อนรีเฟรชหน้า
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        let errorMessage = "เกิดข้อผิดพลาดในการลงทะเบียนห้องพัก";

        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }

        // แสดงข้อความผิดพลาด
        createToast("Error", errorMessage);
        console.error("Error:", error);
      }
    };

    const createToast = (title, content) => {
      toasts.value.push({
        title: title,
        content: content,
      });

      setTimeout(() => {
        toasts.value.shift();
      }, 5000);
    };
    
    const fetchAutoID = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getAutotidRoom", { //เรียกใช้ api เก็บ ค่า roomID ไว้ใน response
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        autoID.value = response.data;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          console.error("เกิดข้อผิดพลาด:", error.response.data.error);
          createToast("ดึงข้อมูล ID เกิดข้อผิดพลาด:", error.response.data.error);
        } else {
          console.error("เกิดข้อผิดพลาดในการทำ Auto id:", error.message || error);
        }
      }
    };

    onMounted(() => {
      fetchAutoID();
      //fetchProvince();
    });

    return {
      autoID,   //return id 
      resRoom_Number,
      resStatus,
      validatedTooltip01,
      handleSubmitTooltip01,
      isRoomInvalid,
      RoomErrorMessage,
      toasts,

      
    };
  }
};

</script>
