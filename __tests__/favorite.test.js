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
// SUITE DE TESTS: FAVORITOS
// ============================================
describe('API de Favoritos', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TESTS DE TOGGLE FAVORITO (PUT /api/movies/:id/favorite)
  // ==========================================
  describe('PUT /api/movies/:id/favorite', () => {

    it('debería marcar como favorita una película que no lo era', async () => {
      // ARRANGE
      const peliculaMock = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        isFavorite: false,
        ownerId: 'user-123',
      };

      const peliculaActualizada = { ...peliculaMock, isFavorite: true };

      prisma.movie.findFirst.mockResolvedValue(peliculaMock);
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .put('/api/movies/movie-1/favorite')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.isFavorite).toBe(true);
      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
      });
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { isFavorite: true },
      });
    });

    it('debería desmarcar como favorita una película que ya lo era', async () => {
      // ARRANGE
      const peliculaMock = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        isFavorite: true,
        ownerId: 'user-123',
      };

      const peliculaActualizada = { ...peliculaMock, isFavorite: false };

      prisma.movie.findFirst.mockResolvedValue(peliculaMock);
      prisma.movie.update.mockResolvedValue(peliculaActualizada);

      // ACT
      const response = await request(app)
        .put('/api/movies/movie-1/favorite')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.isFavorite).toBe(false);
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { isFavorite: false },
      });
    });

    it('debería devolver 404 si la película no existe', async () => {
      // ARRANGE
      prisma.movie.findFirst.mockResolvedValue(null);

      // ACT
      const response = await request(app)
        .put('/api/movies/no-existe/favorite')
        .set('Authorization', 'Bearer fake-token');

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
        .put('/api/movies/movie-1/favorite')
        .set('Authorization', 'Bearer fake-token');

      // ASSERT
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('No se pudo actualizar el favorito');
    });
  });
});
