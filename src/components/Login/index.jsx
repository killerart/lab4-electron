import React, { useCallback } from 'react';
import { MDBAnimation, MDBBtn, MDBInput } from 'mdbreact';
import { Col, Container, Form, Row } from 'reactstrap';

export default function Login({ setUser, setErrorMessage, errorMessage }) {
  const onSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = formData.get('email');
      const password = formData.get('password');
      const smtp = formData.get('smtp');
      const smtpPort = formData.get('smtpPort');
      const imap = formData.get('imap');
      const user = { email, password, smtp, smtpPort, imap };
      setUser(user);
      setErrorMessage('');
    },
    [setErrorMessage, setUser]
  );

  return (
    <MDBAnimation type="fadeIn">
      <Container>
        <Row>
          <Col xs="auto" className="mx-auto mt-5">
            <Form onSubmit={onSubmit}>
              <MDBInput
                label="Email"
                type="email"
                name="email"
                outline
                validate
                required
              />
              <MDBInput
                label="Password"
                type="password"
                name="password"
                outline
                validate
                required
              />
              <Row className="mb-4">
                <Col>
                  <MDBInput
                    valueDefault="smtp.gmail.com"
                    label="SMTP Server"
                    type="text"
                    name="smtp"
                    outline
                    validate
                    required
                  />
                </Col>
                <Col>
                  <MDBInput
                    valueDefault={587}
                    type="number"
                    label="SMTP Port"
                    name="smtpPort"
                    outline
                    validate
                  />
                </Col>
              </Row>
              <MDBInput
                valueDefault="imap.gmail.com"
                label="IMAP Server"
                type="text"
                name="imap"
                outline
                validate
                required
              />
              <div className="md-form">
                <span style={{ color: 'red' }}>{errorMessage}</span>
              </div>
              <MDBBtn className="mx-auto" type="submit" color="light" block>
                Login
              </MDBBtn>
            </Form>
          </Col>
        </Row>
      </Container>
    </MDBAnimation>
  );
}
