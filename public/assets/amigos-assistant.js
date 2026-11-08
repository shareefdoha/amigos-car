(() => {
  const panel = document.getElementById('chatPanel');
  const launcher = document.getElementById('chatLauncher');
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  if (!panel || !launcher || !messages || !input) return;

  const state = { topic: null, pending: null };
  const safetyPattern = /smoke|smoking|fire|flame|burning smell|overheat|overheating|temperature warning|oil pressure|brake fail|brakes failed|pedal (?:goes|went) to the floor|fuel leak|steering failure|wheel came off|airbag deployed|orange cable|high.?voltage|battery (?:is )?(?:swollen|hot)/i;
  const topics = [
    { id: 'brakes', test: /brake|stopping|pedal|rotor|braking/i, service: 'Brake Services', summary: 'Brake symptoms can affect stopping distance. A noise or vibration needs inspection; a soft or sinking pedal or weak braking can make the vehicle unsafe.', ask: 'Does the car stop normally, and is there a warning light?' },
    { id: 'ac', test: /air.?con|\bac\b|not cold|warm air|weak airflow|refrigerant|compressor/i, service: 'Car AC Services', summary: 'Poor AC can come from airflow, a fan, a control fault, a refrigerant leak or another part of the cooling circuit. Warm air alone does not prove refrigerant is low.', ask: 'Is the airflow weak, or is the airflow strong but warm? Is cooling worse at idle?' },
    { id: 'transmission', test: /transmission|gear|shift|slip|clutch|cv[t]?|jerk/i, service: 'Transmission Repair', summary: 'Gear engagement or shifting symptoms can involve fluid condition, electronic controls or internal wear. A fault code alone does not prove the transmission needs replacement.', ask: 'Is it delayed shifting, harsh shifting, slipping, or a noise? Does it happen cold or warm?' },
    { id: 'electrical', test: /electri|battery|alternator|wiring|headlight|light flicker|won.t start|no power|starter|fuse|relay|drain/i, service: 'Electrical Diagnosis and Repair', summary: 'Starting, charging, lighting and accessory faults may share causes such as a weak battery, poor connection, wiring or a control fault. Avoid touching exposed wiring.', ask: 'What stopped working, and did this begin after a jump start, battery change or repair?' },
    { id: 'engine', test: /engine|misfire|knock|check.?engine|oil|coolant|leak|rough idle|stall|exhaust|fuel|overheat|smoke|turbo/i, service: 'Engine Repair / Advanced Vehicle Inspection', summary: 'Engine symptoms can involve ignition, fuel, air, lubrication, cooling or sensors. A warning code points to a detected condition; it does not automatically identify a defective part.', ask: 'When does it happen (cold start, idle, acceleration or all the time), and what warning light or code do you see?' },
    { id: 'steering', test: /steer|suspension|shock|strut|pull(?:s|ing)? to one side|knock over bumps|alignment|vibrat/i, service: 'Advanced Vehicle Inspection', summary: 'Pulling, vibration or suspension noise may come from tyres, alignment, wheel bearings, steering or suspension components. Sudden loss of steering control is an emergency.', ask: 'Does it happen while braking, accelerating, turning or driving over bumps?' },
    { id: 'tyres', test: /tyre|tire|wheel|puncture|flat|pressure|tpms/i, service: 'Advanced Vehicle Inspection', summary: 'A flat, bulging or visibly damaged tyre should not be driven on. Pressure should be checked cold against the vehicle placard or manual.', ask: 'Is the tyre visibly damaged or losing air, or are you noticing vibration or a warning light?' },
    { id: 'body', test: /dent|paint|scratch|accident|collision|bodywork/i, service: 'Denting and Painting', summary: 'Body damage should be checked for hidden damage to lights, sensors, alignment and safety components as well as the visible panel or paint.', ask: 'Which panels are affected, and are any lights, doors, sensors or wheels also affected?' },
    { id: 'maintenance', test: /service|maintenance|inspection|check.?up|booking|pre.?purchase|oil change|mileage/i, service: 'Periodic Maintenance / Advanced Vehicle Inspection', summary: 'A useful maintenance plan depends on the exact model, engine, mileage, service history and how the vehicle is used. Qatar heat and dust may affect severe-service conditions, but do not by themselves establish a different interval.', ask: 'What is the vehicle make, model, year and mileage, and when was it last serviced?' },
    { id: 'hybrid', test: /hybrid|electric vehicle|\bev\b|orange cable|high voltage/i, service: 'Advanced Vehicle Inspection', summary: 'Hybrid and EV high-voltage systems require trained technicians and suitable equipment. Do not touch orange cables or damaged high-voltage parts.', ask: 'Is there a dashboard warning, visible damage, smoke or exposed orange wiring?' }
  ];

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close Amigos Assist chat' : 'Open Amigos Assist chat');
    launcher.textContent = open ? '×' : '✦';
    if (open) input.focus();
  }
  launcher.onclick = () => setOpen(panel.hidden);
  document.getElementById('chatClose').onclick = () => setOpen(false);

  function addMessage(text, who) {
    const el = document.createElement('div');
    el.className = `chatBubble ${who}`;
    el.textContent = who === 'bot' && document.documentElement.lang === 'ar' && window.amigosTranslateText ? window.amigosTranslateText(text) : text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function topicFor(text) { return topics.find(topic => topic.test.test(text)); }
  function answer(text) {
    const q = text.trim();
    const low = q.toLowerCase();
    if (safetyPattern.test(q)) return { topic: null, text: 'Safety first: move to a safe place and stop the vehicle if you can do so safely. Switch off the engine for smoke, severe overheating, an oil-pressure warning or a fuel leak. Do not drive with brake or steering failure, or a badly damaged tyre. Keep clear of flames, hot pressurized coolant and high-voltage parts; contact roadside assistance or recovery.' };
    if (/price|cost|how much|quotation|quote/i.test(q)) return { topic: null, text: 'I don’t have access to Amigos’ live price list or parts availability, so I won’t guess a price. The team can quote after confirming the exact vehicle, symptoms and required work. Request an inspection or call the branch for a current quotation.' };
    if (/code|obd|p0[0-9a-f]{3}/i.test(q)) return { topic: state.topic, text: 'A diagnostic code is evidence of a detected condition, not automatic proof that the named part has failed. Keep the exact code and freeze-frame data if available; avoid clearing it before a technician reviews it. Share the code, vehicle year/make/model and symptoms so I can help explain what it generally means.' };
    if (/book|appointment|branch|location|contact/i.test(q) && !topicFor(q)) return { topic: null, text: 'You can request an appointment using the booking form on this site. Choose your service, preferred branch, date and time; the team must confirm availability. You can also call the Doha team at +974 7778 9303.' };
    if (/qatar|heat|hot weather|dust|sand/i.test(q) && !topicFor(q)) return { topic: 'maintenance', text: 'In Qatar, heavy AC use, heat and dust make it sensible to monitor cooling performance, battery condition, tyre pressures and filters. Follow the correct manufacturer schedule for your exact vehicle and usage; I can’t verify an interval without the model and service information.' };

    const detected = topicFor(q);
    if (state.pending && (!detected || detected.id === state.pending.id)) {
      const topic = state.pending;
      state.pending = null;
      state.topic = topic;
      if (topic.id === 'brakes' && /no|weak|soft|sinking|not sure|unsure/i.test(low)) return { topic: topic.id, text: 'Treat that as urgent. Do not drive if braking is weak or the pedal is soft or sinking. Arrange recovery and a brake inspection.' };
      if (topic.id === 'ac' && /weak/i.test(low)) return { topic: topic.id, text: 'Weak airflow points the inspection toward the cabin filter, blower or ducts. Strong airflow with warm air calls for checks of the cooling circuit, fan and controls. Refrigerant level should be measured and leaks checked before recharge.' };
      if (topic.id === 'transmission' && /slip|rev|barely moves/i.test(low)) return { topic: topic.id, text: 'Avoid hard acceleration and arrange a prompt inspection. A technician can review stored codes, fluid condition and operation; the symptom alone cannot confirm internal failure.' };
      return { topic: topic.id, text: `Thanks, that helps narrow the checks for ${topic.service}. The pattern you described should be verified with inspection and relevant measurements; I can’t confirm a failed part remotely. Note when it happens and any warning messages for the technician.` };
    }
    const topic = detected || topics.find(item => item.id === state.topic);
    if (!topic) return { topic: null, text: 'I can help with engine, transmission, electrical, AC, brakes, steering, tyres, maintenance, inspections and body repairs. Tell me the vehicle make/model/year, the main symptom and when it happens. Share only the details needed for car advice—no passwords, payment details or identity documents.' };

    state.topic = topic.id;
    if (topic.id === 'brakes' && /soft|sinking|floor|weak|failed/i.test(low)) return { topic: topic.id, text: 'A soft, sinking or weak brake pedal can mean the car may not stop safely. Do not drive it; arrange recovery and a brake inspection.' };
    if (topic.id === 'engine' && /oil pressure|temperature warning|overheat/i.test(low)) return { topic: topic.id, text: 'Stop safely and switch off the engine. Continuing with an oil-pressure or overheating warning can cause serious damage. Never open a hot pressurized coolant system; contact a technician before restarting.' };
    if (topic.id === 'hybrid' && /smoke|damage|orange|high voltage/i.test(low)) return { topic: topic.id, text: 'Keep clear of the vehicle’s high-voltage parts and exposed orange cables. Do not touch or attempt repairs. Move to a safe place and contact qualified recovery or emergency assistance if there is smoke or fire.' };

    state.pending = topic;
    return { topic: topic.id, text: `${topic.summary}\n\nA suitable Amigos service is ${topic.service}. The technician will verify the cause before recommending parts or repairs.\n\n${topic.ask}` };
  }

  function send(text) {
    const clean = text.trim();
    if (!clean) return;
    addMessage(clean, 'user');
    const normalized = document.documentElement.lang === 'ar' && window.amigosNormalizeArabicQuery ? window.amigosNormalizeArabicQuery(clean) : clean;
    const reply = answer(normalized);
    addMessage(reply.text, 'bot');
    const actions = document.createElement('div');
    actions.className = 'chatActions';
    const booking = document.createElement('a');
    const bookingService = ({ brakes: 'brake-services', ac: 'car-ac', transmission: 'transmission-repair', electrical: 'electrical-diagnosis', engine: 'engine-repair', steering: 'advanced-inspection', tyres: 'advanced-inspection', body: 'denting-painting', maintenance: 'periodic-maintenance', hybrid: 'advanced-inspection' })[reply.topic];
    booking.href = bookingService ? `/?service=${encodeURIComponent(bookingService)}#book` : '/#book';
    booking.textContent = 'Request an appointment';
    const call = document.createElement('a');
    call.href = 'tel:+97477789303';
    call.textContent = 'Call Doha branch';
    actions.append(booking, call);
    messages.appendChild(actions);
    messages.scrollTop = messages.scrollHeight;
  }
  document.getElementById('chatForm').addEventListener('submit', event => {
    event.preventDefault();
    send(input.value);
    input.value = '';
    input.focus();
  });
  document.getElementById('chatPrompts').addEventListener('click', event => {
    const button = event.target.closest('.chatPrompt');
    if (button) send(button.textContent || '');
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) setOpen(false); });
})();
