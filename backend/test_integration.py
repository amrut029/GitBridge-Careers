import os
import sys
import unittest
from dotenv import load_dotenv

# Ensure Backend is on python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Load env from known path if present
load_dotenv("/Users/amrutbadki/GitBridge Careers/backend/.env")

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
from database import get_users_collection, get_opportunities_collection, get_applications_collection

class GitBridgeIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.users_col = get_users_collection()
        cls.opp_col = get_opportunities_collection()
        cls.app_col = get_applications_collection()

        # Find or create mock test tokens
        cls.student_token = create_access_token("000000000000000000000001", role="student")
        cls.recruiter_token = create_access_token("000000000000000000000002", role="recruiter")
        cls.admin_token = create_access_token("000000000000000000000003", role="admin")

        # Ensure dummy users exist in DB for token resolution
        from bson import ObjectId
        from datetime import datetime

        if cls.users_col is not None:
            cls.users_col.update_one(
                {"_id": ObjectId("000000000000000000000001")},
                {"$set": {
                    "name": "Test Student",
                    "email": "teststudent_qa@gitbridge.local",
                    "role": "student",
                    "target_role": "Full Stack Engineer",
                    "created_at": datetime.utcnow()
                }},
                upsert=True
            )
            cls.users_col.update_one(
                {"_id": ObjectId("000000000000000000000002")},
                {"$set": {
                    "name": "Test Recruiter",
                    "email": "testrecruiter_qa@gitbridge.local",
                    "role": "recruiter",
                    "company": "TechCorp Global",
                    "recruiter_status": "approved",
                    "created_at": datetime.utcnow()
                }},
                upsert=True
            )
            cls.users_col.update_one(
                {"_id": ObjectId("000000000000000000000003")},
                {"$set": {
                    "name": "Test Admin",
                    "email": "testadmin_qa@gitbridge.local",
                    "role": "admin",
                    "created_at": datetime.utcnow()
                }},
                upsert=True
            )

    # 1. Health & Root checks
    def test_01_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("status"), "healthy")

    # 2. Authentication & Profile Rehydration (/me)
    def test_02_auth_me_student(self):
        res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("role"), "student")
        self.assertEqual(data.get("name"), "Test Student")

    def test_03_auth_me_recruiter(self):
        res = self.client.get(
            "/api/auth/me",
            headers={"X-Auth-Token": self.recruiter_token}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("role"), "recruiter")
        self.assertEqual(data.get("company"), "TechCorp Global")

    # 3. Security Role Enforcements
    def test_04_student_cannot_access_admin(self):
        res = self.client.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_05_student_cannot_access_recruiter(self):
        res = self.client.get(
            "/api/recruiter/dashboard",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_06_unauthenticated_request_rejected(self):
        res = self.client.get("/api/dashboard/opportunities")
        self.assertEqual(res.status_code, 401)

    # 4. Student Workflow
    def test_07_student_get_opportunities(self):
        res = self.client.get(
            "/api/dashboard/opportunities",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("opportunities", data)
        self.assertTrue(isinstance(data["opportunities"], list))

    def test_08_student_get_applications(self):
        res = self.client.get(
            "/api/dashboard/applications",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("applications", res.json())

    # 5. Recruiter Workflow
    def test_09_recruiter_profile(self):
        res = self.client.get(
            "/api/recruiter/profile",
            headers={"Authorization": f"Bearer {self.recruiter_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("company"), "TechCorp Global")

    def test_10_recruiter_dashboard(self):
        res = self.client.get(
            "/api/recruiter/dashboard",
            headers={"Authorization": f"Bearer {self.recruiter_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "approved")
        self.assertIn("stats", data)
        self.assertIn("opportunities", data)
        self.assertIn("applications", data)

    def test_11_recruiter_create_and_delete_opportunity(self):
        # Create
        create_res = self.client.post(
            "/api/recruiter/opportunities",
            headers={"Authorization": f"Bearer {self.recruiter_token}"},
            json={
                "title": "Senior AI Systems Engineer",
                "type": "Full-time",
                "domain": "aiml",
                "location": "Bengaluru (Hybrid)",
                "stipend": "₹22 - ₹30 LPA",
                "required_skills": ["Python", "PyTorch", "FastAPI", "Docker"],
                "description": "Lead LLM training cluster infrastructure."
            }
        )
        self.assertEqual(create_res.status_code, 200)
        opp_id = create_res.json().get("opportunity", {}).get("id")
        self.assertTrue(bool(opp_id))

        # Toggle status
        status_res = self.client.patch(
            f"/api/recruiter/opportunities/{opp_id}/status",
            headers={"Authorization": f"Bearer {self.recruiter_token}"},
            json={"is_active": False}
        )
        self.assertEqual(status_res.status_code, 200)
        self.assertFalse(status_res.json().get("is_active"))

        # Delete
        del_res = self.client.delete(
            f"/api/recruiter/opportunities/{opp_id}",
            headers={"Authorization": f"Bearer {self.recruiter_token}"}
        )
        self.assertEqual(del_res.status_code, 200)

    # 6. Admin Workflow
    def test_12_admin_dashboard(self):
        res = self.client.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        stats = res.json().get("stats", {})
        self.assertIn("total_students", stats)
        self.assertIn("total_recruiters", stats)
        self.assertIn("total_opportunities", stats)

    def test_13_admin_students(self):
        res = self.client.get(
            "/api/admin/students",
            headers={"X-Auth-Token": self.admin_token}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("students", res.json())

    def test_14_admin_recruiters(self):
        res = self.client.get(
            "/api/admin/recruiters",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("recruiters", res.json())

    def test_15_admin_sync_logs(self):
        res = self.client.get(
            "/api/admin/sync-logs",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("sync_logs", res.json())

    def test_16_admin_recruiter_status_update(self):
        res = self.client.patch(
            "/api/admin/recruiters/000000000000000000000002/status",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"status": "approved"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("status"), "approved")

    def test_17_admin_applications_and_status(self):
        # 1. Fetch applications list
        res = self.client.get(
            "/api/admin/applications",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("applications", res.json())

        # 2. If an application exists, test status update
        apps = res.json().get("applications", [])
        if apps:
            app_id = apps[0]["id"]
            update_res = self.client.patch(
                f"/api/admin/applications/{app_id}/status",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                json={"status": "Shortlisted"}
            )
            self.assertEqual(update_res.status_code, 200)
            self.assertEqual(update_res.json().get("status"), "Shortlisted")

if __name__ == "__main__":
    unittest.main()

