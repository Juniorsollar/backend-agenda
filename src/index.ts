import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const app: Express = express();
const port: number = 5001;

app.use(cors());
app.use(bodyParser.json());

// Configuração do MySQL
const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root',
  database: 'evento', // Banco de dados onde você armazenará os eventos
});

db.connect((err: mysql.MysqlError | null) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
  } else {
    console.log('Conexão com o MySQL estabelecida');
  }
});

app.get('/', (req: Request, res: Response) => {
  console.log("API funcionando");
  res.send("start");
});

// Rota para criar um evento
app.post('/createEvent', (req: Request, res: Response) => {
  const { startTime, endTime, eventTitle, } = req.body;
  console.log("rota: createEvent")
  console.log(req.body);
  const sql: string = 'INSERT INTO events (startTime, endTime, eventTitle) VALUES (?, ?, ?)';
  db.query(sql, [startTime, endTime, eventTitle], (err: mysql.MysqlError | null, result: mysql.OkPacket) => {
    if (err) {
      console.error('Erro ao criar o evento:', err);
      res.status(500).json({ error: 'Erro ao criar o evento' });
    } else {
      console.log('Evento criado com sucesso');
      res.status(201).json({ message: 'Evento criado com sucesso' });
    }
  });
});

// Rota para listar eventos
app.get('/listEvents', (req: Request, res: Response) => {
  console.log("api: listEvents");

  // Ajuste na consulta SQL para converter as datas para o fuso horário desejado (por exemplo, "America/Sao_Paulo")
  const sql = 'SELECT * FROM events';
  db.query(sql, (err: mysql.MysqlError | null, results: any[]) => {
    if (err) {
      console.error('Erro ao listar eventos:', err);
      res.status(500).json({ error: 'Erro ao listar eventos' });
    } else {
      // Ajuste para converter as datas e horas para o fuso horário local
      const events = results.map(event => ({
        ...event,
        start: utcToZonedTime(new Date(event.startTime), 'America/Sao_Paulo'),
        end: utcToZonedTime(new Date(event.endTime), 'America/Sao_Paulo'),
      }));

      console.log('Eventos listados com sucesso');
      console.log("results");
      console.log(events);
      res.json(events);
    }
  });
});

// Rota para obter dados por ID
app.post('/getData', (req: Request, res: Response) => {
  const eventId: number = parseInt(req.body.id, 10);

  if (isNaN(eventId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const sql: string = 'SELECT * FROM events WHERE id = ?'; // Ajuste para o nome correto da tabela e colunas
  db.query(sql, eventId, (err: mysql.MysqlError | null, results: any[]) => {
    if (err) {
      console.error('Erro ao obter dados por ID:', err);
      res.status(500).json({ error: 'Erro ao obter dados por ID' });
    } else {
      if (results.length === 0) {
        return res.status(404).json({ error: 'Nenhum evento encontrado com o ID fornecido' });
      }

      console.log('Dados obtidos com sucesso por ID');
      console.log("results")
      console.log(results[0])
      res.json(results[0]);
    }
  });
});

app.delete('/removeAllEvents', (req: Request, res: Response) => {
  const sql: string = 'DELETE FROM events';
  db.query(sql, (err: mysql.MysqlError | null, result: mysql.OkPacket) => {
    if (err) {
      console.error('Erro ao excluir todos os eventos:', err);
      res.status(500).json({ error: 'Erro ao excluir todos os eventos' });
    } else {
      console.log('Todos os eventos foram excluídos com sucesso');
      res.status(200).json({ message: 'Todos os eventos foram excluídos com sucesso' });
    }
  });
});

app.delete('/removeEvent/:id', (req: Request, res: Response) => {
  const eventId: number = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const sql: string = 'DELETE FROM events WHERE id = ?'; // Ajuste para o nome correto da coluna
  db.query(sql, eventId, (err: mysql.MysqlError | null, result: mysql.OkPacket) => {
    if (err) {
      console.error('Erro ao remover o evento:', err);
      return res.status(500).json({ error: 'Erro ao remover o evento' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Nenhum evento encontrado com o ID fornecido' });
    }

    console.log('Evento foi removido com sucesso');
    return res.status(200).json({ message: 'Evento foi removido com sucesso' });
  });
});

app.post('/updateEvent', (req: Request, res: Response) => {
  const eventId: number = parseInt(req.body.id, 10);

  if (isNaN(eventId) || !req.body.startTime || !req.body.endTime || !req.body.eventTitle) {
    return res.status(400).json({ error: 'Parâmetros inválidos fornecidos' });
  }

  // Converta as strings de data e hora para objetos Date
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);
  const { eventTitle } = req.body;

  // Certifique-se de que o formato esteja no esperado pelo banco de dados (AAAA-MM-DD HH:mm:ss)
  const formattedStartTime = startTime.toISOString().slice(0, 19).replace('T', ' ');
  const formattedEndTime = endTime.toISOString().slice(0, 19).replace('T', ' ');

  const sql: string = 'UPDATE events SET startTime = ?, endTime = ?, eventTitle = ? WHERE id = ?';

  db.query(sql, [formattedStartTime, formattedEndTime, eventTitle, eventId], (err: mysql.MysqlError | null, result: mysql.OkPacket) => {
    if (err) {
      console.error('Erro ao atualizar o evento:', err);
      res.status(500).json({ error: 'Erro ao atualizar o evento' });
    } else {
      console.log('Evento atualizado com sucesso');
      res.status(200).json({ message: 'Evento atualizado com sucesso' });
    }
  });
});

app.listen(port, () => {
  console.log(`API está rodando na porta ${port}`);
});