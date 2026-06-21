import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Authorize() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState(null);

  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await axios.get(`/api/clients/${id}/public`);
        setClient(response.data);
      } catch (err) {
        setClient({ name: "Unknown Application", id });
      }
    };
    fetchClient();
  }, [id]);

  const handleConfirm = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3371';
    form.action = `${baseUrl}/authorize/confirm`;
    
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.name = 'client_id';
    idInput.value = id;
    form.appendChild(idInput);

    if (codeChallenge) {
      const ccInput = document.createElement('input');
      ccInput.type = 'hidden';
      ccInput.name = 'code_challenge';
      ccInput.value = codeChallenge;
      form.appendChild(ccInput);

      const ccmInput = document.createElement('input');
      ccmInput.type = 'hidden';
      ccmInput.name = 'code_challenge_method';
      ccmInput.value = codeChallengeMethod || 'S256';
      form.appendChild(ccmInput);
    }

    document.body.appendChild(form);
    form.submit();
  };

  const handleDeny = () => {
    window.location.href = '/login';
  };

  return (
    <motion.div 
      className="container"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="title">Authorization Request</h1>
      <p className="subtitle">An application is requesting access to your account.</p>

      <div style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>
        <strong>{client?.name || id}</strong> would like to:
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          <li>Read your profile information</li>
          <li>Verify your email address</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDeny} className="btn btn-secondary">Deny Access</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleConfirm} className="btn btn-primary">Allow Access</motion.button>
      </div>
    </motion.div>
  );
}
