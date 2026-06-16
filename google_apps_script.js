/**
 * Software Development Club (SDC) - Karpagam College of Engineering
 * Google Apps Script Web App Backend API
 * 
 * Instructions:
 * 1. Create a Google Sheet named "SDC_Management_DB".
 * 2. Create two tabs/sheets:
 *    - "Admins" (Columns: ID, Name, Email, Role, Status)
 *    - "Members" (Columns: Member ID, Name, Position, Year, Department, Email, Phone, Photo URL, Date Joined, Status)
 * 3. Go to Extensions -> Apps Script.
 * 4. Paste this code.
 * 5. Deploy as a Web App:
 *    - Click Deploy -> New deployment.
 *    - Select type: Web App.
 *    - Execute as: Me (your-email@gmail.com).
 *    - Who has access: Anyone (required for public API endpoints).
 * 6. Copy the Web App URL and paste it into the React app's configuration.
 */

// Configure CORS and JSON responses
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle CORS Preflight / OPTIONS requests
function doOptions(e) {
  return createResponse({ status: "success", message: "CORS preflight ok" });
}

// GET Requests Router
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    const doc = SpreadsheetApp.openById(sheetId);
    
    if (action === 'getAdmins') {
      const email = e.parameter.email;
      if (!email) {
        return createResponse({ error: true, message: "Email parameter is required" });
      }
      
      const adminSheet = doc.getSheetByName("Admins");
      const adminData = adminSheet.getDataRange().getValues();
      const headers = adminData[0];
      
      // Find admin by email (case-insensitive)
      let foundAdmin = null;
      for (let i = 1; i < adminData.length; i++) {
        const emailIndex = headers.indexOf("Email");
        if (adminData[i][emailIndex].toString().toLowerCase() === email.toLowerCase()) {
          foundAdmin = {};
          headers.forEach((header, index) => {
            foundAdmin[header] = adminData[i][index];
          });
          break;
        }
      }
      
      if (foundAdmin) {
        return createResponse({ error: false, admin: foundAdmin });
      } else {
        return createResponse({ error: true, message: "Unauthorized: Admin record not found", unauthorized: true });
      }
    }
    
    if (action === 'getMembers') {
      const memberSheet = doc.getSheetByName("Members");
      const memberData = memberSheet.getDataRange().getValues();
      const headers = memberData[0];
      const members = [];
      
      for (let i = 1; i < memberData.length; i++) {
        const member = {};
        headers.forEach((header, index) => {
          member[header] = memberData[i][index];
        });
        members.push(member);
      }
      
      return createResponse({ error: false, members: members });
    }
    
    if (action === 'getMember') {
      const memberId = e.parameter.id;
      if (!memberId) {
        return createResponse({ error: true, message: "Member ID parameter is required" });
      }
      
      const memberSheet = doc.getSheetByName("Members");
      const memberData = memberSheet.getDataRange().getValues();
      const headers = memberData[0];
      
      let foundMember = null;
      for (let i = 1; i < memberData.length; i++) {
        const idIndex = headers.indexOf("Member ID");
        if (memberData[i][idIndex].toString() === memberId) {
          foundMember = {};
          headers.forEach((header, index) => {
            foundMember[header] = memberData[i][index];
          });
          break;
        }
      }
      
      if (foundMember) {
        return createResponse({ error: false, member: foundMember });
      } else {
        return createResponse({ error: true, message: "Member not found" });
      }
    }

    if (action === 'getAllAdmins') {
      const adminSheet = doc.getSheetByName("Admins");
      const adminData = adminSheet.getDataRange().getValues();
      const headers = adminData[0];
      const admins = [];
      
      for (let i = 1; i < adminData.length; i++) {
        const admin = {};
        headers.forEach((header, index) => {
          admin[header] = adminData[i][index];
        });
        admins.push(admin);
      }
      
      return createResponse({ error: false, admins: admins });
    }
    
    return createResponse({ error: true, message: "Invalid action or missing parameters" });
    
  } catch (error) {
    return createResponse({ error: true, message: error.toString() });
  }
}

// POST Requests Router (Handles Add, Update, Delete)
function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const requestData = JSON.parse(jsonString);
    const action = requestData.action;
    
    const sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    const doc = SpreadsheetApp.openById(sheetId);
    
    if (action === 'addMember') {
      const memberSheet = doc.getSheetByName("Members");
      const memberData = memberSheet.getDataRange().getValues();
      const headers = memberData[0];
      const newMember = requestData.memberData;
      
      // Validate unique ID
      const idIndex = headers.indexOf("Member ID");
      for (let i = 1; i < memberData.length; i++) {
        if (memberData[i][idIndex].toString() === newMember["Member ID"]) {
          return createResponse({ error: true, message: "Member ID already exists" });
        }
      }
      
      // Append row in correct order of headers
      const newRow = headers.map(header => newMember[header] || "");
      memberSheet.appendRow(newRow);
      
      // Record Activity
      logActivity(doc, requestData.adminEmail, "Member Added", "Added member " + newMember["Name"] + " (" + newMember["Member ID"] + ")");
      
      return createResponse({ error: false, message: "Member added successfully" });
    }
    
    if (action === 'updateMember') {
      const memberSheet = doc.getSheetByName("Members");
      const memberData = memberSheet.getDataRange().getValues();
      const headers = memberData[0];
      const updatedMember = requestData.memberData;
      const idIndex = headers.indexOf("Member ID");
      
      let rowIndex = -1;
      for (let i = 1; i < memberData.length; i++) {
        if (memberData[i][idIndex].toString() === updatedMember["Member ID"]) {
          rowIndex = i + 1; // 1-indexed and header row account
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createResponse({ error: true, message: "Member not found to update" });
      }
      
      // Update the values in sheet
      headers.forEach((header, colIdx) => {
        if (updatedMember[header] !== undefined) {
          memberSheet.getRange(rowIndex, colIdx + 1).setValue(updatedMember[header]);
        }
      });
      
      // Record Activity
      logActivity(doc, requestData.adminEmail, "Member Updated", "Updated member " + updatedMember["Name"] + " (" + updatedMember["Member ID"] + ")");
      
      return createResponse({ error: false, message: "Member updated successfully" });
    }
    
    if (action === 'deleteMember') {
      const memberSheet = doc.getSheetByName("Members");
      const memberData = memberSheet.getDataRange().getValues();
      const headers = memberData[0];
      const idToDelete = requestData.id;
      const idIndex = headers.indexOf("Member ID");
      
      let rowIndex = -1;
      let memberName = "";
      for (let i = 1; i < memberData.length; i++) {
        if (memberData[i][idIndex].toString() === idToDelete) {
          rowIndex = i + 1;
          memberName = memberData[i][headers.indexOf("Name")];
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createResponse({ error: true, message: "Member not found to delete" });
      }
      
      memberSheet.deleteRow(rowIndex);
      
      // Record Activity
      logActivity(doc, requestData.adminEmail, "Member Deleted", "Deleted member " + memberName + " (" + idToDelete + ")");
      
      return createResponse({ error: false, message: "Member deleted successfully" });
    }
    
    // Admin Management Operations (Super Admin Only)
    if (action === 'addAdmin') {
      const adminSheet = doc.getSheetByName("Admins");
      const adminData = adminSheet.getDataRange().getValues();
      const headers = adminData[0];
      const newAdmin = requestData.adminData;
      
      // Validate unique Email
      const emailIndex = headers.indexOf("Email");
      for (let i = 1; i < adminData.length; i++) {
        if (adminData[i][emailIndex].toString().toLowerCase() === newAdmin["Email"].toLowerCase()) {
          return createResponse({ error: true, message: "Admin email already exists" });
        }
      }
      
      const newRow = headers.map(header => newAdmin[header] || "");
      adminSheet.appendRow(newRow);
      
      // Record Activity
      logActivity(doc, requestData.adminEmail, "Admin Added", "Added admin " + newAdmin["Name"] + " (" + newAdmin["Email"] + ")");
      
      return createResponse({ error: false, message: "Admin added successfully" });
    }
    
    if (action === 'updateAdmin') {
      const adminSheet = doc.getSheetByName("Admins");
      const adminData = adminSheet.getDataRange().getValues();
      const headers = adminData[0];
      const updatedAdmin = requestData.adminData;
      const emailIndex = headers.indexOf("Email");
      
      let rowIndex = -1;
      for (let i = 1; i < adminData.length; i++) {
        if (adminData[i][emailIndex].toString().toLowerCase() === updatedAdmin["Email"].toLowerCase()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createResponse({ error: true, message: "Admin not found to update" });
      }
      
      headers.forEach((header, colIdx) => {
        if (updatedAdmin[header] !== undefined && header !== "Email") {
          adminSheet.getRange(rowIndex, colIdx + 1).setValue(updatedAdmin[header]);
        }
      });
      
      // Record Activity
      logActivity(doc, requestData.adminEmail, "Admin Updated", "Updated status/role of " + updatedAdmin["Email"] + " to " + updatedAdmin["Role"] + " (" + updatedAdmin["Status"] + ")");
      
      return createResponse({ error: false, message: "Admin updated successfully" });
    }
    
    if (action === 'deleteAdmin') {
      const adminSheet = doc.getSheetByName("Admins");
      const adminData = adminSheet.getDataRange().getValues();
      const headers = adminData[0];
      const emailToDelete = requestData.email;
      const emailIndex = headers.indexOf("Email");
      
      let rowIndex = -1;
      for (let i = 1; i < adminData.length; i++) {
        if (adminData[i][emailIndex].toString().toLowerCase() === emailToDelete.toLowerCase()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        return createResponse({ error: true, message: "Admin not found to delete" });
      }
      
      adminSheet.deleteRow(rowIndex);
      
      // Record Activity
      logActivity(doc, requestData.adminEmail, "Admin Removed", "Removed admin access for " + emailToDelete);
      
      return createResponse({ error: false, message: "Admin removed successfully" });
    }

    if (action === 'getActivityLogs') {
      const logSheet = doc.getSheetByName("ActivityLogs");
      if (!logSheet) {
        return createResponse({ error: false, logs: [] });
      }
      
      const logData = logSheet.getDataRange().getValues();
      const headers = logData[0];
      const logs = [];
      
      // Return logs in reverse order (newest first), limit to 100 logs
      const startRow = Math.max(1, logData.length - 100);
      for (let i = logData.length - 1; i >= startRow; i--) {
        const log = {};
        headers.forEach((header, index) => {
          log[header] = logData[i][index];
        });
        logs.push(log);
      }
      
      return createResponse({ error: false, logs: logs });
    }
    
    return createResponse({ error: true, message: "Invalid POST action" });
    
  } catch (error) {
    return createResponse({ error: true, message: error.toString() });
  }
}

// Log admin activity helper
function logActivity(doc, adminEmail, actionType, details) {
  try {
    let logSheet = doc.getSheetByName("ActivityLogs");
    if (!logSheet) {
      logSheet = doc.insertSheet("ActivityLogs");
      logSheet.appendRow(["Timestamp", "Admin Email", "Action", "Details"]);
    }
    
    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
    logSheet.appendRow([timestamp, adminEmail || "system", actionType, details]);
  } catch (e) {
    // Ignore logging errors to prevent breaking core operations
  }
}
