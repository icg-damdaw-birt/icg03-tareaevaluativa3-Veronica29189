const request = require('supertest');

// ============================================
// CONFIGURACIÓN DE MOCKS
// ============================================

const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de auth (simula usuario autenticado)
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const prisma = require('../lib/prisma');

// ============================================
// SUITE DE TESTS: RATING
// ============================================
describe('API de Rating', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TESTS DE UPDATE RATING (PATCH /api/movies/:id/rating)
  // ==========================================
  describe('PATCH /api/movies/:id/rating', () => {

    it('debería actualizar el rating de una película correctamente', async () => {
      // ARRANGE
      const peliculaMock = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        rating: 0,
        ownerId: 'user-123',
      };

      const peliculaActualizada = { ...peliculaMock, rating: 5 };

      prisma.movie.findFirst.mockResolvedValue(peliculaMock);
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 5 });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(5);
      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
      });
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { rating: 5 },
      });
    });

    it('debería permitir poner rating a 0 (sin valorar)', async () => {
      // ARRANGE
      const peliculaMock = {
        id: 'movie-1',
        title: 'Inception',
        rating: 4,
        ownerId: 'user-123',
      };

      const peliculaActualizada = { ...peliculaMock, rating: 0 };

      prisma.movie.findFirst.mockResolvedValue(peliculaMock);
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 0 });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(0);
    });

    it('debería devolver 400 si el rating es mayor que 5', async () => {
      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 6 });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
      expect(prisma.movie.findFirst).not.toHaveBeenCalled();
    });

    it('debería devolver 400 si el rating es menor que 0', async () => {
      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: -1 });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
    });

    it('debería devolver 400 si el rating no es un número entero', async () => {
      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3.5 });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
    });

    it('debería devolver 400 si no se envía rating', async () => {
      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({});

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe ser un número entero entre 0 y 5');
    });

    it('debería devolver 404 si la película no existe', async () => {
      // ARRANGE
      prisma.movie.findFirst.mockResolvedValue(null);

      // ACT
      const response = await request(app)
        .patch('/api/movies/no-existe/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3 });

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Película no encontrada');
      expect(prisma.movie.update).not.toHaveBeenCalled();
    });

    it('debería devolver 500 si ocurre un error interno', async () => {
      // ARRANGE
      prisma.movie.findFirst.mockRejectedValue(new Error('DB error'));

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 4 });

      // ASSERT
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('No se pudo actualizar el rating');
    });
  });
});
