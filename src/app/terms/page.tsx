export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-tertiary)] text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-[var(--accent)] to-blue-400 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        
        <div className="glass rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">1. Scope</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              These terms of service apply to the use of the Auberon Chat application. 
              The application enables users to interact with various AI models.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">2. Service Description</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              The application offers the following features:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Chat interface for interactions with AI models</li>
              <li>Storage of conversation histories</li>
              <li>Consensus chat with multiple models simultaneously</li>
              <li>File upload for attachments in conversations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">3. Bring-Your-Own-Key Model</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              The use of the application follows the "Bring-Your-Own-Key" principle:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Users must provide their own OpenRouter API key</li>
              <li>All costs for AI model requests are borne directly by the user through their API key</li>
              <li>The application itself is free to use</li>
              <li>The operator assumes no liability for costs incurred through API usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">4. Registration and User Account</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              Registration is required for use:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Registration is done through Supabase Auth</li>
              <li>Users must provide truthful information</li>
              <li>Each user may only create one account</li>
              <li>Sharing of login credentials is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">5. Permitted Use</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              The following is prohibited when using the application:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Use for illegal purposes</li>
              <li>Distribution of hateful, discriminatory, or offensive content</li>
              <li>Attempting to manipulate or damage the application</li>
              <li>Excessive use that impairs system performance</li>
              <li>Violation of copyrights or other third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">6. Privacy and Storage</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              Regarding data processing:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Chat histories are stored in the Supabase database</li>
              <li>API keys are stored encrypted</li>
              <li>Users can delete their data at any time</li>
              <li>Detailed information can be found in the privacy policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">7. Availability</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The operator strives for high availability of the application but cannot guarantee 
              100% availability. Maintenance work will be announced when possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">8. Limitation of Liability</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              The operator is not liable for:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 ml-4">
              <li>Content generated by AI models</li>
              <li>Costs incurred through the use of API keys</li>
              <li>Data loss due to technical problems</li>
              <li>Damages from improper use of the application</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">9. Termination</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Users can delete their account at any time without giving reasons. The operator reserves 
              the right to suspend or delete accounts for violations of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">10. Changes</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              These terms of service may be changed at any time. Users will be informed of significant 
              changes. Continued use after a change constitutes agreement to the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">11. Final Provisions</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              EU law applies. Should individual provisions be invalid, the validity of the 
              remaining provisions remains unaffected.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-[var(--glass-border)]">
            <p className="text-sm text-[var(--text-tertiary)]">
              Last updated: June 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
