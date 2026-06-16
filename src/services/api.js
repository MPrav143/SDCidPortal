// API Service for KCE SDC Member Card System
// Configures real API calls to Google Apps Script or falls back to LocalStorage for offline/demo testing.

const LOCAL_STORAGE_MEMBERS_KEY = 'kce_sdc_members';
const LOCAL_STORAGE_ADMINS_KEY = 'kce_sdc_admins';
const LOCAL_STORAGE_LOGS_KEY = 'kce_sdc_logs';

// Check if there is an API URL configured in localStorage or environment
let API_URL = localStorage.getItem('kce_sdc_api_url') || "";

export const getApiUrl = () => API_URL;
export const setApiUrl = (url) => {
  API_URL = url;
  if (url) {
    localStorage.setItem('kce_sdc_api_url', url);
  } else {
    localStorage.removeItem('kce_sdc_api_url');
  }
};

// Initial Mock Data
const DEFAULT_ADMINS = [
  { ID: "001", Name: "SDC Admin", Email: "admin@kce.ac.in", Role: "Super Admin", Status: "Active" },
  { ID: "002", Name: "Praveen M", Email: "717823p243@kce.ac.in", Role: "Admin", Status: "Active" }
];

const DEFAULT_MEMBERS = [
  {
    "Member ID": "KCE-SDC-26-001",
    "Name": "Praveen M",
    "Position": "Technical Director",
    "Year": "IV",
    "Department": "Computer Science and Engineering",
    "Email": "717823p243@kce.ac.in",
    "Phone": "9489799270",
    "Photo URL": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2023-08-15",
    "Status": "Active"
  },
  {
    "Member ID": "KCE-SDC-26-002",
    "Name": "Aishwarya R",
    "Position": "President",
    "Year": "IV",
    "Department": "Information Technology",
    "Email": "aishwarya.r@kce.ac.in",
    "Phone": "9876543210",
    "Photo URL": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2023-08-15",
    "Status": "Active"
  },
  {
    "Member ID": "KCE-SDC-26-003",
    "Name": "Sanjay Kumar K",
    "Position": "Vice President",
    "Year": "III",
    "Department": "Computer Science and Engineering",
    "Email": "sanjay.k@kce.ac.in",
    "Phone": "8765432109",
    "Photo URL": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2024-02-10",
    "Status": "Active"
  },
  {
    "Member ID": "KCE-SDC-26-004",
    "Name": "Kavitha S",
    "Position": "Design Lead",
    "Year": "III",
    "Department": "Artificial Intelligence and Data Science",
    "Email": "kavitha.s@kce.ac.in",
    "Phone": "7654321098",
    "Photo URL": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2024-03-01",
    "Status": "Active"
  },
  {
    "Member ID": "KCE-SDC-26-005",
    "Name": "Dinesh Kumar M",
    "Position": "Full Stack Developer",
    "Year": "II",
    "Department": "Computer Science and Engineering",
    "Email": "dinesh.m@kce.ac.in",
    "Phone": "6543210987",
    "Photo URL": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2025-01-20",
    "Status": "Active"
  },
  {
    "Member ID": "KCE-SDC-26-006",
    "Name": "Harini V",
    "Position": "Web Developer",
    "Year": "II",
    "Department": "Electronics and Communication Engineering",
    "Email": "harini.v@kce.ac.in",
    "Phone": "9012345678",
    "Photo URL": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2025-02-05",
    "Status": "Active"
  },
  {
    "Member ID": "KCE-SDC-26-007",
    "Name": "Logesh S",
    "Position": "DevOps Associate",
    "Year": "III",
    "Department": "Information Technology",
    "Email": "logesh.s@kce.ac.in",
    "Phone": "8901234567",
    "Photo URL": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300",
    "Date Joined": "2024-06-12",
    "Status": "Inactive"
  }
];

const DEFAULT_LOGS = [
  { Timestamp: "2026-06-16 09:30:12", "Admin Email": "admin@kce.ac.in", Action: "Admin Login", Details: "Super Admin logged into the system" },
  { Timestamp: "2026-06-16 09:45:00", "Admin Email": "admin@kce.ac.in", Action: "Member Added", Details: "Added member Dinesh Kumar M (KCE-SDC-26-005)" },
  { Timestamp: "2026-06-16 10:15:34", "Admin Email": "admin@kce.ac.in", Action: "Member Updated", Details: "Updated status of Logesh S (KCE-SDC-26-007) to Inactive" }
];

// Initialize LocalStorage if empty
const initMockDB = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(DEFAULT_ADMINS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_LOGS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
  }
};
initMockDB();

// Log activities locally helper
const logActivityLocal = (adminEmail, action, details) => {
  const logs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOGS_KEY)) || [];
  const now = new Date();
  const timestamp = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0') + ' ' + 
                    String(now.getHours()).padStart(2, '0') + ':' + 
                    String(now.getMinutes()).padStart(2, '0') + ':' + 
                    String(now.getSeconds()).padStart(2, '0');
  logs.unshift({ Timestamp: timestamp, "Admin Email": adminEmail || "system", Action: action, Details: details });
  localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
};

// HELPER: Make requests using standard simple text content to bypass Apps Script CORS preflight issues
async function makePostRequest(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Prevents CORS preflight OPTIONS request
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

export const api = {
  // Authentication check
  async getAdmin(email) {
    if (!API_URL) {
      // Mock API
      const admins = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY));
      const admin = admins.find(a => a.Email.toLowerCase() === email.toLowerCase());
      if (admin) {
        logActivityLocal(email, "Admin Login", `${admin.Name} logged in successfully`);
        return { error: false, admin };
      } else {
        return { error: true, message: "Unauthorized: Admin record not found", unauthorized: true };
      }
    }

    try {
      const response = await fetch(`${API_URL}?action=getAdmins&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error in getAdmin:", error);
      throw error;
    }
  },

  // Get all members
  async getMembers() {
    if (!API_URL) {
      const members = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY));
      return { error: false, members };
    }

    try {
      const response = await fetch(`${API_URL}?action=getMembers`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error in getMembers:", error);
      throw error;
    }
  },

  // Get member by ID
  async getMemberById(id) {
    if (!API_URL) {
      const members = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY));
      const member = members.find(m => m["Member ID"].toLowerCase() === id.trim().toLowerCase());
      if (member) {
        return { error: false, member };
      } else {
        return { error: true, message: "Member not found" };
      }
    }

    try {
      const response = await fetch(`${API_URL}?action=getMember&id=${encodeURIComponent(id)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error in getMemberById:", error);
      throw error;
    }
  },

  // Add a member
  async addMember(memberData, adminEmail) {
    if (!API_URL) {
      const members = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY));
      // check unique Member ID
      const exists = members.some(m => m["Member ID"] === memberData["Member ID"]);
      if (exists) {
        return { error: true, message: "Member ID already exists" };
      }
      members.push(memberData);
      localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(members));
      logActivityLocal(adminEmail, "Member Added", `Added member ${memberData.Name} (${memberData["Member ID"]})`);
      return { error: false, message: "Member added successfully" };
    }

    try {
      return await makePostRequest(API_URL, {
        action: 'addMember',
        memberData,
        adminEmail
      });
    } catch (error) {
      console.error("API Error in addMember:", error);
      throw error;
    }
  },

  // Update a member
  async updateMember(memberData, adminEmail) {
    if (!API_URL) {
      const members = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY));
      const index = members.findIndex(m => m["Member ID"] === memberData["Member ID"]);
      if (index === -1) {
        return { error: true, message: "Member not found to update" };
      }
      members[index] = { ...members[index], ...memberData };
      localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(members));
      logActivityLocal(adminEmail, "Member Updated", `Updated member ${memberData.Name} (${memberData["Member ID"]})`);
      return { error: false, message: "Member updated successfully" };
    }

    try {
      return await makePostRequest(API_URL, {
        action: 'updateMember',
        memberData,
        adminEmail
      });
    } catch (error) {
      console.error("API Error in updateMember:", error);
      throw error;
    }
  },

  // Delete a member
  async deleteMember(id, adminEmail) {
    if (!API_URL) {
      const members = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY));
      const member = members.find(m => m["Member ID"] === id);
      if (!member) {
        return { error: true, message: "Member not found to delete" };
      }
      const updatedMembers = members.filter(m => m["Member ID"] !== id);
      localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updatedMembers));
      logActivityLocal(adminEmail, "Member Deleted", `Deleted member ${member.Name} (${id})`);
      return { error: false, message: "Member deleted successfully" };
    }

    try {
      return await makePostRequest(API_URL, {
        action: 'deleteMember',
        id,
        adminEmail
      });
    } catch (error) {
      console.error("API Error in deleteMember:", error);
      throw error;
    }
  },

  // ADMIN OPERATIONS (Super Admin Only)
  async getAdmins() {
    if (!API_URL) {
      const admins = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY));
      return { error: false, admins };
    }

    try {
      const response = await fetch(`${API_URL}?action=getAllAdmins`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error in getAdmins:", error);
      throw error;
    }
  },

  async addAdmin(adminData, adminEmail) {
    if (!API_URL) {
      const admins = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY));
      const exists = admins.some(a => a.Email.toLowerCase() === adminData.Email.toLowerCase());
      if (exists) {
        return { error: true, message: "Admin email already exists" };
      }
      admins.push(adminData);
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(admins));
      logActivityLocal(adminEmail, "Admin Added", `Added admin ${adminData.Name} (${adminData.Email})`);
      return { error: false, message: "Admin added successfully" };
    }

    try {
      return await makePostRequest(API_URL, {
        action: 'addAdmin',
        adminData,
        adminEmail
      });
    } catch (error) {
      console.error("API Error in addAdmin:", error);
      throw error;
    }
  },

  async updateAdmin(adminData, adminEmail) {
    if (!API_URL) {
      const admins = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY));
      const index = admins.findIndex(a => a.Email.toLowerCase() === adminData.Email.toLowerCase());
      if (index === -1) {
        return { error: true, message: "Admin not found to update" };
      }
      admins[index] = { ...admins[index], ...adminData };
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(admins));
      logActivityLocal(adminEmail, "Admin Updated", `Updated status/role of ${adminData.Email} to ${adminData.Role} (${adminData.Status})`);
      return { error: false, message: "Admin updated successfully" };
    }

    try {
      return await makePostRequest(API_URL, {
        action: 'updateAdmin',
        adminData,
        adminEmail
      });
    } catch (error) {
      console.error("API Error in updateAdmin:", error);
      throw error;
    }
  },

  async deleteAdmin(email, adminEmail) {
    if (!API_URL) {
      const admins = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY));
      const index = admins.findIndex(a => a.Email.toLowerCase() === email.toLowerCase());
      if (index === -1) {
        return { error: true, message: "Admin not found to delete" };
      }
      admins.splice(index, 1);
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(admins));
      logActivityLocal(adminEmail, "Admin Removed", `Removed admin access for ${email}`);
      return { error: false, message: "Admin removed successfully" };
    }

    try {
      return await makePostRequest(API_URL, {
        action: 'deleteAdmin',
        email,
        adminEmail
      });
    } catch (error) {
      console.error("API Error in deleteAdmin:", error);
      throw error;
    }
  },

  // Get Activity Logs
  async getActivityLogs() {
    if (!API_URL) {
      const logs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOGS_KEY)) || [];
      return { error: false, logs };
    }

    try {
      const response = await fetch(`${API_URL}?action=getActivityLogs`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error in getActivityLogs:", error);
      throw error;
    }
  }
};
