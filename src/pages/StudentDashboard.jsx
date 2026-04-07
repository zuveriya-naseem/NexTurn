import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axios from "axios";
import { Briefcase, FileText, CheckSquare, MessageSquare, LogOut, Home, Navigation2, Search } from "lucide-react";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [active, setActive] = useState("Dashboard");
  
  // Data State
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [intRes, appRes, taskRes, feedRes] = await Promise.all([
          axios.get('/api/internships'),
          axios.get('/api/applications'),
          axios.get('/api/tasks'),
          axios.get('/api/feedback')
        ]);
        setInternships(intRes.data);
        setApplications(appRes.data);
        setTasks(taskRes.data);
        setFeedbacks(feedRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
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
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5",
      ].join(" ")}
    >
      <Icon className="w-5 h-5" />
      {name}
    </button>
  );

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-8">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <span className="font-bold text-lg">NT</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">NexTurn</h2>
              <p className="text-xs text-zinc-500">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem name="Dashboard" icon={Home} />
          <NavItem name="Browse Internships" icon={Search} />
          <NavItem name="My Applications" icon={FileText} />
          <NavItem name="Tasks & Progress" icon={CheckSquare} />
          <NavItem name="Mentor Feedback" icon={MessageSquare} />
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-lg font-bold">
              {user?.name?.[0] || 'S'}
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.name || 'Student'}</p>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{active}</h1>
          <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition">
            <Navigation2 className="w-4 h-4 -rotate-90" /> Back to Home
          </Link>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {active === "Dashboard" && (
            <DashboardOverview 
              applications={applications} 
              tasks={tasks}
              feedbacks={feedbacks} 
            />
          )}
          {active === "Browse Internships" && (
            <BrowseInternships 
              internships={internships} 
              applications={applications}
              onApply={() => {
                axios.get('/api/applications').then(res => setApplications(res.data));
              }}
            />
          )}
          {active === "My Applications" && (
            <MyApplications applications={applications} />
          )}
          {active === "Tasks & Progress" && (
            <StudentTasks 
              tasks={tasks} 
              onUpdate={() => {
                axios.get('/api/tasks').then(res => setTasks(res.data));
              }}
            />
          )}
          {active === "Mentor Feedback" && (
            <MentorFeedback feedbacks={feedbacks} />
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardOverview({ applications, tasks, feedbacks }) {
  const pendingTasks = tasks.filter(t => t.completionStatus === 'pending').length;
  const avgScore = feedbacks.length > 0 
    ? Math.round(feedbacks.reduce((a, b) => a + b.score, 0) / feedbacks.length) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Applications" value={applications.length} icon={FileText} color="blue" />
        <StatCard title="Pending Tasks" value={pendingTasks} icon={CheckSquare} color="orange" />
        <StatCard title="Average Score" value={`${avgScore}%`} icon={MessageSquare} color="green" />
      </div>

      <div className="bg-white dark:bg-white/5 rounded-2xl p-6 ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Welcome to NexTurn</h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
          Navigate using the sidebar to find internships, submit applications, manage your assigned tasks, and review mentor feedback. Make sure to regularly check your tasks and submit progress reports to receive valuable evaluations.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    green: "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
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

function BrowseInternships({ internships, applications, onApply }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const appliedIds = applications.map(a => a.internshipId);

  const filtered = internships.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const submitApplication = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/applications', { internshipId: selectedId, coverLetter });
      alert("Application submitted successfully!");
      setSelectedId(null);
      setCoverLetter("");
      onApply();
    } catch (err) {
      alert("Failed to apply: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search internships by title or company..."
          className="w-full bg-white dark:bg-white/5 border-none ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Apply for Internship</h3>
            <p className="text-sm text-zinc-500 mb-6">Write a brief cover letter highlighting your skills.</p>
            <form onSubmit={submitApplication}>
              <textarea
                required
                rows={5}
                className="w-full rounded-xl bg-zinc-50 dark:bg-black/20 border-none ring-1 ring-zinc-200 dark:ring-white/10 p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none text-sm"
                placeholder="Dear Hiring Manager..."
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setSelectedId(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/5 transition">Cancel</button>
                <button disabled={loading} type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(i => {
          const isApplied = appliedIds.includes(i.id);
          return (
            <div key={i.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm flex flex-col hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{i.title}</h3>
                  <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                    <Briefcase className="w-4 h-4" /> {i.company}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold rounded-lg text-zinc-600 dark:text-zinc-300">
                  {i.status}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 flex-1">{i.description}</p>
              <div className="mt-6 border-t border-zinc-100 dark:border-white/5 pt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Posted by {i.adminName || "Admin"}</span>
                <button 
                  onClick={() => setSelectedId(i.id)}
                  disabled={isApplied}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${isApplied ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'}`}
                >
                  {isApplied ? 'Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-zinc-500 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10">
            No internships found.
          </div>
        )}
      </div>
    </div>
  );
}

function MyApplications({ applications }) {
  if (applications.length === 0) return <p className="text-zinc-500">You haven't applied to any internships yet.</p>;

  const statusColors = {
    pending: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10",
    accepted: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/10",
    rejected: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10"
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {applications.map(app => (
        <div key={app.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">{app.title}</h3>
            <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
              <Briefcase className="w-4 h-4" /> {app.company}
            </p>
            <p className="mt-3 text-xs text-zinc-400">Applied on: {new Date(app.appliedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
             <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${statusColors[app.status]}`}>
               {app.status}
             </span>
             {app.status === 'accepted' && (
                <span className="text-xs text-green-500">Check Tasks module automatically</span>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentTasks({ tasks, onUpdate }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  if (tasks.length === 0) return <p className="text-zinc-500">No tasks assigned yet. Get accepted to an internship first!</p>;

  const submitTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/tasks/${selectedTask.studentTaskId}/status`, { status: 'completed', report });
      alert("Task submitted!");
      setSelectedTask(null);
      onUpdate();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Complete Task: {selectedTask.title}</h3>
            <p className="text-sm text-zinc-500 mb-6">Provide a short report or link to your work.</p>
            <form onSubmit={submitTask}>
              <textarea
                required
                rows={4}
                className="w-full rounded-xl bg-zinc-50 dark:bg-black/20 border-none ring-1 ring-zinc-200 dark:ring-white/10 p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none text-sm"
                placeholder="I completed this by..."
                value={report}
                onChange={e => setReport(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/5 transition">Cancel</button>
                <button disabled={loading} type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition disabled:opacity-50">
                  {loading ? "Submitting..." : "Mark Completed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.map(t => (
          <div key={t.studentTaskId} className={`bg-white dark:bg-white/5 p-6 rounded-2xl ring-1 shadow-sm flex flex-col ${t.completionStatus === 'completed' ? 'ring-green-500/30 bg-green-50/30 dark:bg-green-900/10' : 'ring-zinc-200 dark:ring-white/10'}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">{t.internshipTitle}</span>
              <span className={`text-xs font-semibold uppercase ${t.completionStatus === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                {t.completionStatus}
              </span>
            </div>
            <h4 className="font-bold text-lg mb-2">{t.title}</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 flex-1 mb-4">{t.description}</p>
            {t.deadline && <p className="text-xs text-zinc-500 mb-4">Deadline: {new Date(t.deadline).toLocaleString()}</p>}
            
            {t.completionStatus === 'pending' ? (
              <button onClick={() => setSelectedTask(t)} className="w-full mt-auto py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition">
                Submit Report
              </button>
            ) : (
              <div className="mt-auto p-4 rounded-xl bg-zinc-50 dark:bg-black/20 text-sm border border-zinc-100 dark:border-white/5">
                <p className="font-semibold text-xs text-zinc-400 mb-1">Your Report:</p>
                <p>{t.report}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MentorFeedback({ feedbacks }) {
  if (feedbacks.length === 0) return <p className="text-zinc-500">No feedback received yet.</p>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {feedbacks.map(f => (
        <div key={f.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl ring-1 ring-zinc-200 dark:ring-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{f.internshipTitle}</p>
              <p className="text-xs text-zinc-500 mt-1">From: {f.mentorName} • {new Date(f.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-md">
              {f.score}
            </div>
          </div>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm p-4 bg-zinc-50 dark:bg-black/20 rounded-xl italic">
            "{f.feedbackText}"
          </p>
        </div>
      ))}
    </div>
  );
}