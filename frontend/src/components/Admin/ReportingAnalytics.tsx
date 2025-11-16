import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaFilter, 
  FaChartBar, 
  FaUsers, 
  FaTasks, 
  FaProjectDiagram,
  FaExclamationTriangle,
  FaCalendar,
  FaCheckCircle
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './ReportingAnalytics.module.css';

interface Project {
  id: number;
  name: string;
  description: string;
  client_company_id: number;
  admin_id: number;
  status: string;
  deadline: string;
  client_company_name?: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  assigned_to: number;
  status: string;
  priority: string;
  progress_percentage: number;
  deadline: string;
  created_by: number;
  assigned_user_name?: string;
  project_name?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number;
  is_active: boolean;
}

const ReportingAnalytics: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'overview' | 'projects' | 'team' | 'clients'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsResponse = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch tasks
      const tasksResponse = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasksData = await tasksResponse.json();
      setTasks(tasksData);

      // Fetch team members (developers and managers)
      const usersResponse = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      const teamUsers = usersData.filter((user: User) => 
        (user.role === 'developer' || user.role === 'manager') && user.is_active
      );
      setTeamMembers(teamUsers);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Calculate metrics from real data
  const calculateMetrics = () => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(project => project.status === 'completed').length;
    const activeProjects = projects.filter(project => project.status === 'active').length;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.progress_percentage === 100
    ).length;

    // Calculate team productivity based on task completion
    const teamProductivity = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Mock client satisfaction (in real app, this would come from a ratings table)
    const clientSatisfaction = 4.7;

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      teamProductivity,
      clientSatisfaction
    };
  };

  // Get project progress data
  const getProjectProgressData = () => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id);
      const completedTasks = projectTasks.filter(task => 
        task.status === 'completed' || task.progress_percentage === 100
      );
      const progress = projectTasks.length > 0 
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0;

      return {
        id: project.id,
        name: project.name,
        progress,
        deadline: project.deadline,
        tasks: projectTasks.length,
        completed: completedTasks.length,
        status: project.status,
        clientName: project.client_company_name || 'N/A'
      };
    });
  };

  // Get team performance data
  const getTeamPerformanceData = () => {
    return teamMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assigned_to === member.id);
      const completedTasks = memberTasks.filter(task => 
        task.status === 'completed' || task.progress_percentage === 100
      );
      const productivity = memberTasks.length > 0 
        ? Math.round((completedTasks.length / memberTasks.length) * 100)
        : 0;

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        tasks: memberTasks.length,
        completed: completedTasks.length,
        productivity
      };
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate professional PDF report
  const generatePDFReport = async () => {
    try {
      setGeneratingPDF(true);
      
      const metrics = calculateMetrics();
      const projectProgressData = getProjectProgressData();
      const teamPerformanceData = getTeamPerformanceData();
      
      // Create PDF document
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add header
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT MANAGEMENT REPORT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(`Generated By: ${user?.name || 'System'}`, pageWidth / 2, 37, { align: 'center' });

      yPosition = 60;

      // Report Summary Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryText = `This report provides a comprehensive overview of project performance, team productivity, and key metrics for the selected time period (${timeRange}). The data reflects current project status, task completion rates, and overall team efficiency.`;
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
      doc.text(splitSummary, margin, yPosition);
      yPosition += splitSummary.length * 5 + 10;

      // Key Metrics Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KEY PERFORMANCE INDICATORS', margin, yPosition);
      yPosition += 15;

      // Metrics in a table format
      const metricsData = [
        ['Total Projects', metrics.totalProjects.toString()],
        ['Active Projects', metrics.activeProjects.toString()],
        ['Completed Projects', metrics.completedProjects.toString()],
        ['Total Tasks', metrics.totalTasks.toString()],
        ['Completed Tasks', metrics.completedTasks.toString()],
        ['Team Productivity', `${metrics.teamProductivity}%`],
        ['Client Satisfaction', `${metrics.clientSatisfaction}/5`]
      ];

      doc.setFontSize(10);
      metricsData.forEach(([label, value], index) => {
        const x = margin + (index % 2) * (pageWidth / 2 - margin);
        const y = yPosition + Math.floor(index / 2) * 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, x, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, x + 40, y);
      });

      yPosition += Math.ceil(metricsData.length / 2) * 8 + 15;

      // Check for page break
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }

      // Project Progress Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT PROGRESS OVERVIEW', margin, yPosition);
      yPosition += 10;

      projectProgressData.forEach((project, index) => {
        // Check for page break before each project
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${project.name}`, margin, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Progress: ${project.progress}%`, margin, yPosition);
        doc.text(`Tasks: ${project.completed}/${project.tasks} completed`, margin + 50, yPosition);
        doc.text(`Status: ${project.status}`, margin + 110, yPosition);
        yPosition += 5;

        if (project.deadline) {
          doc.text(`Deadline: ${formatDate(project.deadline)}`, margin, yPosition);
          yPosition += 5;
        }

        // Progress bar visualization
        const progressBarWidth = 100;
        const progressBarHeight = 4;
        const progressFill = (project.progress / 100) * progressBarWidth;
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, progressBarWidth, progressBarHeight);
        
        // Color based on progress
        if (project.progress < 50) {
          doc.setFillColor(231, 76, 60); // Red
        } else if (project.progress < 80) {
          doc.setFillColor(241, 196, 15); // Yellow
        } else {
          doc.setFillColor(46, 204, 113); // Green
        }
        
        doc.rect(margin, yPosition, progressFill, progressBarHeight, 'F');
        yPosition += 10;

        // Add spacing between projects
        yPosition += 5;
      });

      // Check for page break
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }

      // Team Performance Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TEAM PERFORMANCE', margin, yPosition);
      yPosition += 10;

      teamPerformanceData.forEach((member, index) => {
        // Check for page break before each team member
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        
        if(member.role === 'developer') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${member.name} (${member.role})`, margin, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        doc.text(`Productivity: ${member.productivity}%`, margin, yPosition);
        doc.text(`Tasks Completed: ${member.completed}/${member.tasks}`, margin + 60, yPosition);
        yPosition += 8;
        }

        // Productivity bar
        const productivityBarWidth = 80;
        const productivityBarHeight = 3;
        const productivityFill = (member.productivity / 100) * productivityBarWidth;
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, productivityBarWidth, productivityBarHeight);
        
        // Color based on productivity
        if (member.productivity < 70) {
          doc.setFillColor(231, 76, 60); // Red
        } else if (member.productivity < 85) {
          doc.setFillColor(241, 196, 15); // Yellow
        } else {
          doc.setFillColor(46, 204, 113); // Green
        }
        
        doc.rect(margin, yPosition, productivityFill, productivityBarHeight, 'F');
        yPosition += 8;

        // Add spacing between team members
        yPosition += 4;
      });

      // Footer
      const footerY = pageHeight - 10;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Confidential - For Internal Use Only', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      const fileName = `project-report-${reportType}-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      setGeneratingPDF(false);
      alert('PDF report generated successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      setGeneratingPDF(false);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Alternative method using html2canvas (commented out but available)
  const generateReportWithScreenshot = async () => {
    try {
      setGeneratingPDF(true);
      
      const element = document.getElementById('report-content');
      if (!element) {
        throw new Error('Report content not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit image to page
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const imgX = (pageWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `project-report-snapshot-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setGeneratingPDF(false);
      alert('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF with screenshot:', error);
      setGeneratingPDF(false);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const metrics = calculateMetrics();
  const projectProgressData = getProjectProgressData();
  const teamPerformanceData = getTeamPerformanceData();

  if (loading) return <div className={styles.loading}>Loading Reports...</div>;

  return (
    <div className={styles['reporting-analytics']}>
      <div className={styles['page-header']}>
        <div className={styles['header-content']}>
          <button className={styles['btn-back']} onClick={onBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Reporting & Analytics</h1>
          <p>Generate progress reports and view project health overview</p>
        </div>
        <button 
          className={styles['btn-primary']} 
          onClick={generatePDFReport}
          disabled={generatingPDF}
        >
          <FaDownload /> 
          {generatingPDF ? 'Generating PDF...' : 'Generate PDF Report'}
        </button>
      </div>

      {/* Report Controls */}
      <div className={styles['report-controls']}>
        <div className={styles['control-group']}>
          <label>Time Range</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        <div className={styles['control-group']}>
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
            <option value="overview">Overview</option>
            <option value="projects">Projects</option>
            <option value="team">Team Performance</option>
            <option value="clients">Client Reports</option>
          </select>
        </div>
      </div>

      {/* Report content that can be captured for PDF */}
      <div id="report-content">
        {/* Key Metrics */}
        <div className={styles['metrics-grid']}>
          <div className={styles['metric-card']}>
            <div className={styles['metric-icon']}>
              <FaProjectDiagram />
            </div>
            <div className={styles['metric-info']}>
              <h3>{metrics.totalProjects}</h3>
              <p>Total Projects</p>
              <small>{metrics.activeProjects} active</small>
            </div>
          </div>
          <div className={styles['metric-card']}>
            <div className={styles['metric-icon']}>
              <FaTasks />
            </div>
            <div className={styles['metric-info']}>
              <h3>{metrics.totalTasks}</h3>
              <p>Total Tasks</p>
              <small>{metrics.completedTasks} completed</small>
            </div>
          </div>
          <div className={styles['metric-card']}>
            <div className={styles['metric-icon']}>
              <FaChartBar />
            </div>
            <div className={styles['metric-info']}>
              <h3>{metrics.teamProductivity}%</h3>
              <p>Team Productivity</p>
              <small>Based on task completion</small>
            </div>
          </div>
          <div className={styles['metric-card']}>
            <div className={styles['metric-icon']}>
              <FaUsers />
            </div>
            <div className={styles['metric-info']}>
              <h3>{metrics.clientSatisfaction}/5</h3>
              <p>Client Satisfaction</p>
              <small>Average rating</small>
            </div>
          </div>
        </div>

        {/* Charts and Reports */}
        <div className={styles['reports-container']}>
          {reportType === 'overview' && (
            <div className={styles['report-section']}>
              <h2>Project Overview</h2>
              <div className={styles['charts-grid']}>
                <div className={styles['chart-card']}>
                  <h3>Project Progress</h3>
                  <div className={styles['progress-bars']}>
                    {projectProgressData.slice(0, 5).map(project => (
                      <div key={project.id} className={styles['progress-item']}>
                        <div className={styles['progress-info']}>
                          <span>{project.name}</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className={styles['progress-bar']}>
                          <div 
                            className={`${styles['progress-fill']} ${
                              project.progress < 50 ? styles.low : 
                              project.progress < 80 ? styles.medium : styles.high
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className={styles['project-meta']}>
                          <span>
                            <FaCheckCircle /> {project.completed}/{project.tasks} tasks
                          </span>
                          {project.deadline && (
                            <span>
                              <FaCalendar /> {new Date(project.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles['chart-card']}>
                  <h3>Task Completion</h3>
                  <div className={styles['completion-stats']}>
                    <div className={styles['completion-item']}>
                      <span>Completed Tasks</span>
                      <span className={styles['completed-count']}>
                        {metrics.completedTasks}
                      </span>
                    </div>
                    <div className={styles['completion-item']}>
                      <span>In Progress</span>
                      <span className={styles['inprogress-count']}>
                        {metrics.totalTasks - metrics.completedTasks}
                      </span>
                    </div>
                    <div className={styles['completion-item']}>
                      <span>Total Tasks</span>
                      <span className={styles['total-count']}>
                        {metrics.totalTasks}
                      </span>
                    </div>
                    <div className={styles['completion-rate']}>
                      <strong>Completion Rate: </strong>
                      {Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other report sections remain the same */}
          {reportType === 'projects' && (
            <div className={styles['report-section']}>
              <h2>Project Reports</h2>
              <div className={styles['projects-report']}>
                {projectProgressData.map(project => (
                  <div key={project.id} className={styles['project-report-card']}>
                    <h3>{project.name}</h3>
                    <div className={styles['project-stats']}>
                      <div className={styles['stat']}>
                        <span>Progress</span>
                        <strong className={
                          project.progress < 50 ? styles.low :
                          project.progress < 80 ? styles.medium : styles.high
                        }>
                          {project.progress}%
                        </strong>
                      </div>
                      <div className={styles['stat']}>
                        <span>Tasks</span>
                        <strong>{project.completed}/{project.tasks}</strong>
                      </div>
                      <div className={styles['stat']}>
                        <span>Completion</span>
                        <strong>
                          {project.tasks > 0 ? Math.round((project.completed / project.tasks) * 100) : 0}%
                        </strong>
                      </div>
                      {project.deadline && (
                        <div className={styles['stat']}>
                          <span>Deadline</span>
                          <strong>{new Date(project.deadline).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </div>
                    {project.deadline && new Date(project.deadline) < new Date() && project.progress < 100 && (
                      <div className={styles['overdue-warning']}>
                        <FaExclamationTriangle /> Project is overdue
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'team' && (
            <div className={styles['report-section']}>
              <h2>Team Performance</h2>
              <div className={styles['team-report']}>
                {teamPerformanceData.map(member => (
                  <div key={member.id} className={styles['team-member-card']}>
                    <h3>{member.name}</h3>
                    <div className={styles['member-stats']}>
                      <div className={styles['stat']}>
                        <span>Tasks Assigned</span>
                        <strong>{member.tasks}</strong>
                      </div>
                      <div className={styles['stat']}>
                        <span>Tasks Completed</span>
                        <strong>{member.completed}</strong>
                      </div>
                      <div className={styles['stat']}>
                        <span>Completion Rate</span>
                        <strong className={
                          member.productivity < 70 ? styles.low :
                          member.productivity < 85 ? styles.medium : styles.high
                        }>
                          {member.productivity}%
                        </strong>
                      </div>
                    </div>
                    <div className={styles['productivity-bar']}>
                      <div 
                        className={`${styles['productivity-fill']} ${
                          member.productivity < 70 ? styles.low :
                          member.productivity < 85 ? styles.medium : styles.high
                        }`}
                        style={{ width: `${member.productivity}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'clients' && (
            <div className={styles['report-section']}>
              <h2>Client Reports</h2>
              <div className={styles['clients-report']}>
                <div className={styles['info-message']}>
                  <FaChartBar />
                  <p>Client reports feature coming soon. This will include client-specific analytics and satisfaction metrics.</p>
                </div>
                <div className={styles['client-stats']}>
                  <h3>Current Client Projects</h3>
                  {projects.filter(p => p.client_company_name).map(project => (
                    <div key={project.id} className={styles['client-project']}>
                      <span className={styles['client-name']}>
                        {project.client_company_name}
                      </span>
                      <span className={styles['project-name']}>{project.name}</span>
                      <span className={`${styles['status']} ${styles[project.status]}`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportingAnalytics;