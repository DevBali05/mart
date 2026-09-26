import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      <h1>Welcome</h1>

      <p>
        Please select your account type to continue
      </p>

      <div className="role-buttons">

        <button onClick={() => navigate("/admin-login")}>
          👨‍💼 Admin
          <small>Manage orders & system</small>
        </button>

        <button onClick={() => navigate("/child-login")}>
          👤 User / Client
          <small>View orders & account</small>
        </button>

      </div>

    </div>
  );
}