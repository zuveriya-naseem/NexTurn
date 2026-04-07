import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axios from "axios";
import { Briefcase, Users, PlusCircle, CheckSquare, MessageSquare, LogOut, Home, Navigation2, Check, X } from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [active, setActive] = useState("Dashboard");
  
  // Data State
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);

  const fetchData = async () => {
    try {
      const [intRes, appRes, taskRes] = await Promise.all([
        axios.get('/api/internships'),
        axios.get('/api/applications'),
        axios.get('/api/tasks')
      ]);
      setInternships(intRes.data);
      setApplications(appRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLogout = () => {
    logout();
    nav("/");
  };

  const NavItem = ({ name, icon: Icon }) => (
    <button
      onClick={() => setActive(name)}
      className={[
        "w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 text-sm font-medium transition",
        active === name
          ? "bg-green-600 text-white shadow-md shadow-green-600/20"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5",
      ].join(" ")}
    >
      <Icon className="w-5 h-5" />
      {name}
    </button>
  );

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <aside className="w-72 flex flex-col border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-8">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-600/20">
              <span className="font-bold text-lg">NT</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">NexTurn</h2>
              <p className="text-xs text-zinc-500">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem name="Dashboard" icon={Home} />
          <NavItem name="Post Internships" icon={PlusCircle} />
          <NavItem name="Applicants" icon={Users} />
          <NavItem name="Manage Tasks" icon={CheckSquare} />
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-200 dark:border-white/10">
           <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-lg font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.name || 'Admin'}</p>
              <p className="text-xs text-zinc-500 truncate w-32">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{active}</h1>
          <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition">
            <Navigation2 className="w-4 h-4 -rotate-90" /> Back to Home
          </Link>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
           {active === "Dashboard" && (
            <AdminOverview internships={internships} applications={applications} />
           )}
           {active === "Post Internships" && (
            <PostInternship onPosted={fetchData} />
           )}
           {active === "Applicants" && (
            <Applicants applications={applications} onUpdate={fetchData} />
           )}
           {active === "Manage Tasks" && (
            <ManageTasks 
              tasks={tasks} 
              internships={internships} 
              applications={applications} 
              onUpdate={fetchData} 
            />
           )}
        </div>
      </main>
    </div>
  );
}

function AdminOverview({ internships, applications }) {
  const pendingApps = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Internships" value={internships.length} icon={Briefcase} color="indigo" />
        <StatCard title="Total Applications" value={applications.length} icon={Users} color="blue" />
        <StatCard title="Pending Review" value={pendingApps} icon={CheckSquare} color="orange" />
      </div>

      <div className="bg-white dark:bg-white/5 rounded-2xl p-6 ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Quick Start</h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
          Welcome to the Admin portal! From here you can post new internship opportunities, review student applications, assign tasks to your interns, and provide constructive feedback on their reports.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  };
  
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 ring-1 ring-zinc-200 dark:ring-white/10 flex items-center gap-4 shadow-sm hover:shadow-md transition">
      <div className={`p-4 rounded-xl ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

function PostInternship({ onPosted }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/internships', { title, company, description });
      alert("Internship posted successfully!");
      setTitle("");
      setCompany("");
      setDescription("");
      onPosted();
    } catch (err) {
      alert("Failed to post: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl bg-white dark:bg-white/5 p-8 rounded-3xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-bold mb-6">Create New Internship</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <input 
              required value={title} onChange={e => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-green-500 outline-none" 
              placeholder="e.g. Frontend Developer" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Company / Team</label>
            <input 
              required value={company} onChange={e => setCompany(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-green-500 outline-none" 
              placeholder="e.g. NexTurn Tech" 
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea 
            required rows={5} value={description} onChange={e => setDescription(e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-green-500 outline-none resize-none" 
            placeholder="Describe the role and responsibilities..." 
          />
        </div>
        <button disabled={loading} type="submit" className="w-full py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50">
          {loading ? "Posting..." : "Post Internship"}
        </button>
      </form>
    </div>
  );
}

function Applicants({ applications, onUpdate }) {
  if (applications.length === 0) return <p className="text-zinc-500">No applications received yet.</p>;

  const handleUpdate = async (id, status) => {
    try {
      await axios.put(`/api/applications/${id}`, { status });
      onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {applications.map(app => (
        <div key={app.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">{app.studentName}</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{app.internshipTitle}</p>
              <p className="text-xs text-zinc-500">{app.studentEmail} • Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
            </div>
            {app.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <button onClick={() => handleUpdate(app.id, 'accepted')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20" title="Accept">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => handleUpdate(app.id, 'rejected')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20" title="Reject">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
               <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${app.status === 'accepted' ? 'text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400' : 'text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400'}`}>
                 {app.status}
               </span>
            )}
          </div>
          <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-xl">
            <p className="text-xs font-semibold text-zinc-500 mb-1">Cover Letter:</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{app.coverLetter}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ManageTasks({ tasks, internships, applications, onUpdate }) {
  const [internshipId, setInternshipId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackTaskId, setFeedbackTaskId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [score, setScore] = useState("");

  const acceptedStudentsByInternship = applications.filter(a => a.status === 'accepted');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Find all accepted students for this internship
    const studentIds = applications.filter(a => a.internshipId == internshipId && a.status === 'accepted').map(a => a.studentId);
    
    try {
      await axios.post('/api/tasks', { internshipId, title, description, deadline: null, assignedStudentIds: studentIds });
      alert("Task created and assigned!");
      setTitle("");
      setDescription("");
      onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    const task = tasks.find(t => t.studentTaskId === feedbackTaskId);
    if(!task) return;
    
    try {
      await axios.post('/api/feedback', { studentId: task.studentId, internshipId: task.internshipId || internships.find(i=>i.title === task.internshipTitle)?.id, feedbackText, score: parseInt(score) });
      alert("Feedback submitted!");
      setFeedbackTaskId(null);
      setFeedbackText("");
      setScore("");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Create Task Form */}
      <div className="bg-white dark:bg-white/5 p-6 rounded-3xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm max-w-3xl">
        <h3 className="text-lg font-bold mb-4">Assign New Task</h3>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <select 
            required value={internshipId} onChange={e => setInternshipId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="" disabled>Select Internship Program</option>
            {internships.map(i => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>
          <input 
            required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-green-500 outline-none" 
            placeholder="Task Title" 
          />
          <textarea 
            required rows={3} value={description} onChange={e => setDescription(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-green-500 outline-none resize-none" 
            placeholder="Task Description..." 
          />
          <button disabled={loading || !internshipId} type="submit" className="px-6 py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50">
            {loading ? "Assigning..." : "Assign Task to Interns"}
          </button>
        </form>
      </div>

      {feedbackTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Provide Feedback</h3>
            <form onSubmit={submitFeedback}>
              <div className="mb-4">
                 <label className="text-xs text-zinc-500">Score (0-100)</label>
                 <input type="number" required min="0" max="100" value={score} onChange={e=>setScore(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 p-3 outline-none" />
              </div>
              <textarea
                required rows={4}
                className="w-full rounded-xl bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 p-4 outline-none resize-none text-sm"
                placeholder="Give constructive feedback..."
                value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setFeedbackTaskId(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/5 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 shadow-md transition">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List */}
      <div>
        <h3 className="text-lg font-bold mb-4">Student Progress</h3>
        {tasks.length === 0 ? <p className="text-zinc-500 text-sm">No tasks assigned yet.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.filter(t => t.studentName).map(t => (
              <div key={t.studentTaskId} className="bg-white dark:bg-white/5 p-5 rounded-2xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase text-zinc-500">{t.studentName}</span>
                  <span className={`text-xs font-semibold uppercase ${t.completionStatus === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                    {t.completionStatus}
                  </span>
                </div>
                <h4 className="font-bold">{t.title}</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3">{t.internshipTitle}</p>
                
                {t.completionStatus === 'completed' && (
                  <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-white/5">
                    <p className="text-xs font-semibold text-zinc-500 mb-1">Student Report:</p>
                    <p className="text-sm mb-3 bg-zinc-50 dark:bg-black/20 p-2 rounded-lg">{t.report}</p>
                    <button onClick={() => setFeedbackTaskId(t.studentTaskId)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      Give General Feedback
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}