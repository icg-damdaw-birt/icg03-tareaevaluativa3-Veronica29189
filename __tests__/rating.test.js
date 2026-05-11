/**
 * TESTS DE RATING DE PELÍCULAS
 * 
 * Este archivo contiene tests para el endpoint de rating de películas.
 * Usamos MOCKS de Prisma para no tocar la base de datos real durante los tests.
 * 
 * El endpoint PATCH /api/movies/:id/rating permite calificar una película
 * con un valor entre 0 y 5.
 */

const request = require('supertest');

// ============================================
// CONFIGURACIÓN DE MOCKS
// ============================================

// Mock del módulo prisma ANTES de importar el servidor
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  movie: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

// Mock del middleware de autenticación
// Simula que el usuario está autenticado con userId 'user-123'
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const prisma = require('../lib/prisma');

// ============================================
// SUITE DE TESTS: API DE RATING
// ============================================
describe('API de Rating de Películas', () => {
  // Limpiar todos los mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TESTS: PATCH /api/movies/:id/rating
  // ==========================================
  describe('PATCH /api/movies/:id/rating', () => {
    
    it('debería calificar una película con rating válido (3)', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        posterUrl: 'https://example.com/inception.jpg',
        isFavorite: false,
        rating: 0,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const peliculaActualizada = {
        ...peliculaExistente,
        rating: 3,
      };

      // Mock: findFirst encuentra la película del usuario
      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);
      // Mock: update actualiza el rating
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3 });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(3);
      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
      });
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { rating: 3 },
      });
    });

    it('debería calificar una película con rating máximo (5)', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-2',
        title: 'The Matrix',
        director: 'Wachowski Sisters',
        year: 1999,
        posterUrl: 'https://example.com/matrix.jpg',
        isFavorite: true,
        rating: 4,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const peliculaActualizada = {
        ...peliculaExistente,
        rating: 5,
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-2/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 5 });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(5);
    });

    it('debería devolver 404 si la película no existe', async () => {
      // ARRANGE
      // Mock: no encuentra la película
      prisma.movie.findFirst.mockResolvedValue(null);

      // ACT
      const response = await request(app)
        .patch('/api/movies/no-existe/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3 });

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Película no encontrada');
    });

    it('debería devolver 400 si el rating es menor a 0', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        ownerId: 'user-123',
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: -1 });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('debería devolver 400 si el rating es mayor a 5', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        ownerId: 'user-123',
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 6 });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('debería devolver 400 si el rating es undefined', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        ownerId: 'user-123',
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({});

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('debería devolver 400 si el rating es null', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        ownerId: 'user-123',
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: null });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('debería devolver 404 si la película pertenece a otro usuario', async () => {
      // ARRANGE
      // La película existe pero pertenece a otro usuario
      // Cuando el controlador busca con ownerId del usuario actual,
      // no debería encontrar nada (devuelve null)
      prisma.movie.findFirst.mockResolvedValue(null);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-3/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 4 });

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Película no encontrada');
    });

    it('debería permitir cambiar el rating de una película', async () => {
      // ARRANGE
      const peliculaExistente = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        rating: 2,  // Ya tiene rating previo
        ownerId: 'user-123',
      };

      const peliculaActualizada = {
        ...peliculaExistente,
        rating: 4,  // Nuevo rating
      };

      prisma.movie.findFirst.mockResolvedValue(peliculaExistente);
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 4 });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(4);
    });

  });
});