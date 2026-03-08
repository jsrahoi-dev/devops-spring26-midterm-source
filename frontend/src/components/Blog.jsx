import './Blog.css'

export default function Blog() {
  return (
    <div className="blog-page">
      <div className="blog-container">
        <h1>DevOps Journey</h1>

        <article className="blog-post">
          <h2>Building a Cloud-Native Color Perception App</h2>
          <p className="blog-meta">March 8, 2026</p>

          <section>
            <h3>AWS Infrastructure</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Deployed to
              Amazon EC2 with RDS MySQL database. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </section>

          <section>
            <h3>CI/CD Pipeline</h3>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. GitHub Actions automated deployment with
              Docker containerization.
            </p>
          </section>

          <section>
            <h3>Challenges & Learnings</h3>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium. Learned about semantic versioning, blue-green
              deployments, and container orchestration.
            </p>
          </section>

          <section>
            <h3>Future Improvements</h3>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.
              Planning to add Kubernetes, implement auto-scaling, and add monitoring dashboards.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
