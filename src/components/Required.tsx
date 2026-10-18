import React from 'react';

// Red asterisk marking a required form field
export const Req: React.FC = () => (
  <span className="ml-1 text-red-600 dark:text-red-400" title="Bắt buộc">*</span>
);
