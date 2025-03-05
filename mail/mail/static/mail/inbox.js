document.addEventListener('DOMContentLoaded', function() {
  
  send_mail();

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {   
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.classList.add('email-item');
      emailDiv.id = `email-item-${email.id}`;

      if (email.read) {
        emailDiv.style.backgroundColor = 'gray'; 
      } else {
        emailDiv.style.backgroundColor = 'white';
      }

      emailDiv.innerHTML = `
        <strong>${email.sender}</strong>: ${email.subject}
        <span class="email-date">${email.timestamp}</span>`;

      
      emailDiv.addEventListener('click', () => {
        load_email(email.id);
      });

      document.querySelector('#emails-view').append(emailDiv);
    });
  })
}

function send_mail() {
  const form = document.querySelector('#compose-form');

  form.addEventListener('submit', function(event) {
    event.preventDefault(); 

    const recipient = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result)
      load_mailbox('sent'); 
    });
  });
}

function load_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {

      const emailView = document.querySelector('#emails-view');

        emailView.innerHTML = `
        <h3>${email.subject}</h3>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr></hr>
        <p>${email.body}</p>`;

      const currentUser = document.querySelector('h2').textContent.trim();
      if (email.sender !== currentUser) {
        const replyButton = document.createElement('button');
        replyButton.textContent = 'Reply';
        replyButton.className = 'btn btn-sm btn-outline-primary';
        replyButton.addEventListener('click', () => {
          reply_email(email); 
        });
        emailView.append(replyButton);  
      }


      if (!email.archived && email.sender !== currentUser) {
        const archiveButton = document.createElement('button');
        archiveButton.textContent = 'Archive';
        archiveButton.className = 'btn btn-sm btn-outline-primary';
        archiveButton.addEventListener('click', () => {
          archive_email(id, true);
        });
        emailView.append(archiveButton);
      }


      if (email.archived) {
        const unarchiveButton = document.createElement('button');
        unarchiveButton.textContent = 'Unarchive';
        unarchiveButton.className = 'btn btn-sm btn-outline-secondary';
        unarchiveButton.addEventListener('click', () => {
          archive_email(id, false);
        });
        emailView.append(unarchiveButton);
      }

      if (!email.read) {
        mark_Asread(id);
      }
    });
}

function mark_Asread(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT', 
    body: JSON.stringify({
      read: true
    })
  });
}

function archive_email(id, archive) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive
    })
  })
  .then(() => {
    load_mailbox('inbox'); 
  });
}

function reply_email(email) {

  compose_email();

  document.querySelector('#compose-recipients').value = email.sender;

  const PreSubject = "Re: ";
  document.querySelector('#compose-subject').value = email.subject.startsWith(PreSubject)
    ? email.subject :
     `${PreSubject}${email.subject}`;

  const timestamp = email.timestamp;
  const whoSends = email.sender;
  const previousBody = email.body;
  const replyBody = `\n\nOn ${timestamp}, ${whoSends} wrote:\n${previousBody}`;
  document.querySelector('#compose-body').value = replyBody;
}
