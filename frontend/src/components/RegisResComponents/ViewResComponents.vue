<template>
  <div>
    <CRow>
      <CCol :md="10"></CCol>
      <CCol :md="2">
        <CButton
          color="primary"
          class="w-100"
          block
          style="margin-bottom: 10px"
          @click="$router.push('/RegisResident')"
        >
        <i class="fa-solid fa-user-plus"></i>
           New
        </CButton>
      </CCol>
    </CRow>

    <CRow style="margin-bottom: 10px">
      <CCol :md="2">
        <CFormSelect v-model="selectedClass" aria-label="Filter by Class">
          <option value="">ทั้งหมด</option>
          <option v-for="role in roles" :key="role.role_id" :value="role.role_Name">
            {{ role.role_Name }}
          </option>
        </CFormSelect>
      </CCol>
      <CCol :md="7"> </CCol>
      <CCol :md="3">
        <CInputGroup>
          <CFormInput placeholder="Search..." v-model="searchQuery" />
          <CInputGroupText>
            <CIcon name="cil-magnifying-glass" />
          </CInputGroupText>
        </CInputGroup>
      </CCol>
    </CRow>

    <div class="row">
      <div class="col-md-12">
        <div class="card mb-4">
          <div class="card-header"><i class="fa-solid fa-table"></i> ตารางผู้ใช้งาน</div>
          <div class="card-body table-responsive p-0">
            <table class="table">
              <thead>
                <tr>
                  <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
                  <th>แสดง</th>
                  <th>แก้ไข</th>
                  <th>ลบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in paginatedItems" :key="item.user_ID">
                  <td>{{ item.user_ID }}</td>
                  <td>{{ item.user_Fname }}</td>
                  <td>{{ item.user_Lname }}</td>
                  <td>{{ item.user_Email }}</td>
                  <td>{{ item.user_Phone }}</td>
                  <td>{{ item.user_Name }}</td>
                  <td>{{ item.roleName }}</td>
                  <td>
                    <button
                      class="btn btn-info btn-sm fontwhite"
                      @click="showModal(item)"
                    >
                    <i class="fa-solid fa-eye"></i> รายละเอียด
                    </button>
                  </td>
                  <td>
                    <button
                      class="btn btn-warning btn-sm "
                      @click="
                        $router.push({
                          path: '/EditResView',
                          query: { id: item.user_ID },
                        })
                      "
                    >
                    <i class="fa-solid fa-user-pen"></i> แก้ไข
                    </button>
                  </td>
                  <td>
                    <button
                      class="btn btn-danger btn-sm fontwhite"
                      @click="showModalDelete(item)"
                    >
                    <i class="fa-solid fa-trash"></i>  ลบ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <div class="row">
              <div class="col-md-4">
                <div class="d-flex align-items-center">
                  <span>Show</span>
                  <select
                    v-model="rowsPerPage"
                    class="form-select mx-2"
                    style="width: auto"
                  >
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>
              <div class="col-md-8 d-flex justify-content-end">
                <button
                  class="btn btn-secondary"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  Previous
                </button>
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="setPage(page)"
                  :class="
                    page === currentPage
                      ? 'btn btn-primary mx-1'
                      : 'btn btn-secondary mx-1'
                  "
                >
                  {{ page }}
                </button>
                <button
                  class="btn btn-secondary"
                  :disabled="currentPage === totalPages"
                  @click="currentPage++"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6"></div>
    </div>
    <CModal
      alignment="center"
      :visible="visibleViewModal"
      @close="closeModal"
      aria-labelledby="VerticallyCenteredExample"
      size="lg"
    >
      <CModalHeader>
        <CModalTitle id="VerticallyCenteredExample">ข้อมูลผู้ใช้</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <modelViewRegisComponents :selectedUser="selectedUser" />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeModal">ปิด</CButton>
      </CModalFooter>
    </CModal>

    <CModal
      alignment="center"
      :visible="visibleDeleteModal"
      @close="closeDeleteModal"
      aria-labelledby="VerticallyCenteredExample"
      size="lg"
    >
      <CModalHeader>
        <CModalTitle id="VerticallyCenteredExample">เลือกสถา่นะเพื่อยกเลิก</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <!-- <modelViewRegisComponents :selectedUser="selectedUser" /> -->
        <!-- <DeleteResComponent :selectedUser="selectedUser"/> -->
        <DeleteResComponent
          :selectedUser="selectedUser"
          :closeModal="closeDeleteModal"
          :refreshViewData="fetchUser"
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeDeleteModal">ปิด</CButton>
      </CModalFooter>
    </CModal>

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

<style scoped>
  .fontwhite{
    color: white;
  }
</style>


<script>
import { ref, watch, onMounted, computed } from "vue";
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from "@coreui/vue";
import axios from "axios";
import modelViewRegisComponents from "./modelViewRegisComponents.vue";
import RegisResComponents from "./RegisResComponents.vue";
import DeleteResComponent from "./DeleteResComponent.vue";

export default {
  name: "ViewResComponents",
  components: {
    modelViewRegisComponents,
    RegisResComponents,
    DeleteResComponent,
  },
  setup() {
    const truncateText = (text, maxLength) => {
      if (text.length > maxLength) {
        return text.substring(0, maxLength) + "...";
      }
      return text;
    };

    const columns = ref([
      { key: "user_ID", label: "รหัส" },
      { key: "user_Fname", label: "ชื่อ" },
      { key: "user_Lname", label: "สกุล" },
      { key: "user_Email", label: "อีเมล์" },
      { key: "user_Phone", label: "เบอร์" },
      { key: "user_Name", label: "Username" },
      { key: "roleName", label: "ตำแหน่ง" },
    ]);

    const users = ref([]);
    const roles = ref([]);
    const searchQuery = ref("");
    const selectedClass = ref("");
    const filteredItems = ref([]);
    const rowsPerPage = ref(10);
    const currentPage = ref(1);
    const visibleViewModal = ref(false);
    const visibleDeleteModal = ref(false);
    const selectedUser = ref({});

    const totalPages = computed(() => {
      return Math.ceil(filteredItems.value.length / rowsPerPage.value);
    });

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getUser", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        users.value = response.data.map((user) => ({
          ...user,
          address: truncateText(user.address, 10),
        }));
        filterItems();
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
        showToast("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้", "error");
      }
    };

    const fetchRole = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getRole", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        roles.value = response.data;
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล role:", error);
        showToast("เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง", "error");
      }
    };
    const showToast = (content, type = "success") => {
      toasts.value.push({
        title: type === "error" ? "Error" : "Success",
        content: content,
      });
    };

    const filterItems = () => {
      filteredItems.value = users.value
        .filter((item) => {
          const matchesClass = selectedClass.value
            ? item.roleName === selectedClass.value
            : true;

          const matchesSearch =
            item.user_ID?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            item.user_Fname?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            item.user_Lname?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            item.user_Email?.toLowerCase().includes(searchQuery.value.toLowerCase());

          return matchesClass && matchesSearch;
        })
        .sort((a, b) => {
          if (a.user_ID < b.user_ID) return -1;
          if (a.user_ID > b.user_ID) return 1;
          return 0;
        });
    };

    const showModal = (item) => {
      selectedUser.value = item;
      visibleViewModal.value = true;
      console.log("View Modal Opened:", visibleViewModal.value);
    };

    const showModalDelete = (item) => {
      selectedUser.value = item;
      visibleDeleteModal.value = true;
      console.log("View Modal Opened:", visibleDeleteModal.value);
    };

    const closeModal = () => {
      visibleViewModal.value = false;
      selectedUser.value = {}; // ล้างข้อมูลเมื่อปิด modal
    };

    const closeDeleteModal = () => {
      visibleDeleteModal.value = false;
      selectedUser.value = {}; // ล้างข้อมูลเมื่อปิด modal
      fetchUser();
    };

    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * rowsPerPage.value;
      const end = start + rowsPerPage.value;
      return filteredItems.value.slice(start, end);
    });

    const setPage = (page) => {
      currentPage.value = page;
    };

    onMounted(() => {
      fetchUser();
      fetchRole();
    });

    watch([selectedClass, searchQuery], () => {
      filterItems();
      currentPage.value = 1;
    });

    return {
      columns,
      users,
      roles,
      searchQuery,
      selectedClass,
      filteredItems,
      paginatedItems,
      rowsPerPage,
      currentPage,
      totalPages,
      setPage,
      showModal,
      showModalDelete,
      closeModal,
      visibleViewModal,
      visibleDeleteModal,
      closeDeleteModal,
      selectedUser,
    };
  },
};
</script>
