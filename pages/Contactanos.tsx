import React from 'react';

const Contactanos: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-4">Contáctanos</h1>
      <p className="mb-6 text-slate-700">¿Tienes preguntas o quieres una demo personalizada? Escríbenos y te responderemos a la brevedad.</p>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <p className="text-sm text-slate-600">Email: <a href="mailto:ventas@fleetmaster.example" className="text-indigo-600">ventas@fleetmaster.example</a></p>
        <p className="text-sm text-slate-600">Teléfono: <a href="tel:+34123456789" className="text-indigo-600">+34 123 456 789</a></p>

        <div>
          <h2 className="font-semibold mb-2">Mensaje</h2>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <input className="w-full border rounded px-3 py-2" placeholder="Tu nombre" />
            <input className="w-full border rounded px-3 py-2" placeholder="Tu email" />
            <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="¿En qué podemos ayudarte?" />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contactanos;
