// ══════════════════════════════════════════════════════════════════════════════
// memories_drops.dart — Flutter page: "Giọt Ký ức" (Memories Drops)
// 3D Wheel + Gooey + Pill cards + Motion-driven UI
// ─── Dependencies ───
// pubspec.yaml:
//   lucide_icons: ^0.321.0
//   flutter_animate: ^4.5.0
// ══════════════════════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:lucide_icons/lucide_icons.dart';

// ─── Entry point ───
void main() => runApp(const MemoriesDropsApp());

class MemoriesDropsApp extends StatelessWidget {
  const MemoriesDropsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Giọt Ký ức',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Colors.black,
        fontFamily: '.SF Pro Display', // fallback to system sans-serif
      ),
      home: const MemoriesDropsPage(),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA MODEL
// ══════════════════════════════════════════════════════════════════════════════

class MemoryDatum {
  final String title;
  final String? moodEmoji;
  final DateTime date;
  final String? content;
  final String? imageUrl;

  const MemoryDatum({
    required this.title,
    this.moodEmoji,
    required this.date,
    this.content,
    this.imageUrl,
  });
}

// ─── Sample data (mirrors Supabase-backed list in Next.js) ───
final List<MemoryDatum> sampleMemories = [
  const MemoryDatum(title: 'Kỷ niệm tuổi thơ', moodEmoji: '😊', date: DateTime(2026, 7, 20)),
  const MemoryDatum(title: 'Buổi hẹn hò đầu tiên', moodEmoji: '🤩', date: DateTime(2026, 7, 18)),
  const MemoryDatum(title: 'Hoàn thành dự án', moodEmoji: '😌', date: DateTime(2026, 7, 15)),
  const MemoryDatum(title: 'Chuyến đi biển', moodEmoji: '😊', date: DateTime(2026, 7, 10)),
  const MemoryDatum(title: 'Mất điện thoại', moodEmoji: '😢', date: DateTime(2026, 7, 5)),
  const MemoryDatum(title: 'Cãi nhau với bạn', moodEmoji: '😤', date: DateTime(2026, 6, 28)),
  const MemoryDatum(title: 'Ngủ quên mất', moodEmoji: '😴', date: DateTime(2026, 6, 25)),
  const MemoryDatum(title: 'Sinh nhật bất ngờ', moodEmoji: '🤩', date: DateTime(2026, 6, 20)),
  const MemoryDatum(title: 'Đi dạo công viên', moodEmoji: '😌', date: DateTime(2026, 6, 18)),
  const MemoryDatum(title: 'Buổi phỏng vấn', moodEmoji: '😊', date: DateTime(2026, 6, 15)),
  const MemoryDatum(title: 'Tản bộ ven hồ', moodEmoji: '😊', date: DateTime(2026, 6, 12)),
  const MemoryDatum(title: 'Xem phim cùng gia đình', moodEmoji: '😊', date: DateTime(2026, 6, 10)),
  const MemoryDatum(title: 'Cơn mưa đầu mùa', moodEmoji: '😌', date: DateTime(2026, 6, 8)),
  const MemoryDatum(title: 'Bài hát yêu thích', moodEmoji: '🤩', date: DateTime(2026, 6, 5)),
  const MemoryDatum(title: 'Cuối tuần thư giãn', moodEmoji: '😌', date: DateTime(2026, 6, 1)),
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

Color moodColor(String? emoji) {
  switch (emoji) {
    case '😊': return const Color(0xFFFF9500);
    case '😢': return const Color(0xFF5856D6);
    case '🤩': return const Color(0xFFFF2D55);
    case '😌': return const Color(0xFF34C759);
    case '😤': return const Color(0xFFE6002D);
    case '😴': return const Color(0xFF8E8E93);
    default: return const Color(0xFF8E8E93);
  }
}

String relativeTime(DateTime d) {
  final now = DateTime.now();
  final diff = DateTime(now.year, now.month, now.day)
      .difference(DateTime(d.year, d.month, d.day))
      .inDays;
  if (diff == 0) return 'Hôm nay';
  if (diff == 1) return 'Hôm qua';
  if (diff < 30) return '$diff ngày trước';
  if (diff < 365) return '${diff ~/ 30} tháng trước';
  return '${diff ~/ 365} năm trước';
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

class MemoriesDropsPage extends StatefulWidget {
  const MemoriesDropsPage({super.key});

  @override
  State<MemoriesDropsPage> createState() => _MemoriesDropsPageState();
}

class _MemoriesDropsPageState extends State<MemoriesDropsPage> {
  late final FixedExtentScrollController _controller;
  double _scrollFraction = 0.0; // offset in "item units" (unbounded)
  bool _isMoving = false;       // true while finger/wheel is actively moving
  int? _detailIndex;            // non-null → detail bottom sheet open

  // ─── Layout constants ───
  static const double kItemExtent = 120.0;
  static const double kPerspective = 0.002;
  static const double kDiameterRatio = 1.8;

  // ─── Card constants ───
  static const double kAvatarSize = 80.0;
  static const double kPillWidth = 140.0;
  static const double kPillHeight = 52.0;

  @override
  void initState() {
    super.initState();
    _controller = FixedExtentScrollController();
    _controller.addListener(_onScroll);
    // Listen to scroll-start / scroll-end for border toggle
    _controller.position.isScrollingNotifier.addListener(_onScrollStateChange);
  }

  @override
  void dispose() {
    _controller.position.isScrollingNotifier.removeListener(_onScrollStateChange);
    _controller.removeListener(_onScroll);
    _controller.dispose();
    super.dispose();
  }

  void _onScroll() {
    setState(() {
      _scrollFraction = _controller.offset / kItemExtent;
    });
  }

  void _onScrollStateChange() {
    setState(() {
      _isMoving = _controller.position.isScrollingNotifier.value;
    });
  }

  // ─── Snap to nearest item (click on dot) ───
  void _snapTo(int index) {
    _controller.animateToItem(
      index,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final centerIdx = _scrollFraction.round().clamp(0, sampleMemories.length - 1);
    final centerMemory = sampleMemories[centerIdx];

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              children: [
                // ─── Header ───
                _Header(onBack: () => Navigator.maybePop(context)),

                // ─── Wheel ───
                Expanded(
                  child: Stack(
                    children: [
                      // Gooey glow layer — liquid blob behind avatars
                      Positioned.fill(
                        child: IgnorePointer(
                          child: _GooeyLayer(
                            itemCount: sampleMemories.length,
                            scrollFraction: _scrollFraction,
                            itemExtent: kItemExtent,
                          ),
                        ),
                      ),

                      // Main 3D wheel
                      ListWheelScrollView.useDelegate(
                        controller: _controller,
                        itemExtent: kItemExtent,
                        perspective: kPerspective,
                        diameterRatio: kDiameterRatio,
                        physics: const FixedExtentScrollPhysics(),
                        childDelegate: ListWheelChildBuilderDelegate(
                          childCount: sampleMemories.length,
                          builder: (_, index) {
                            final diff = index - _scrollFraction;
                            return _DropCard(
                              diff: diff,
                              memory: sampleMemories[index],
                              isMoving: _isMoving,
                              onPlay: () => setState(() => _detailIndex = index),
                              avatarSize: kAvatarSize,
                              pillWidth: kPillWidth,
                              pillHeight: kPillHeight,
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // ─── Dot pagination ───
                _DotBar(
                  memories: sampleMemories,
                  centerIndex: centerIdx,
                  onTap: _snapTo,
                ),
              ],
            ),

            // ─── Detail overlay ───
            if (_detailIndex != null)
              Positioned.fill(
                child: _DetailSheet(
                  memory: sampleMemories[_detailIndex!],
                  onClose: () => setState(() => _detailIndex = null),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════════════════════

class _Header extends StatelessWidget {
  final VoidCallback onBack;
  const _Header({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      color: Colors.black,
      child: Row(
        children: [
          // Back
          _IconBtn(
            icon: LucideIcons.chevronLeft,
            onTap: onBack,
          ),
          const SizedBox(width: 8),
          const Icon(LucideIcons.droplets, size: 16, color: Color(0xFF34C759)),
          const SizedBox(width: 6),
          const Text(
            'Giọt Ký ức',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: Color(0xFFCCCCCC),
              letterSpacing: -0.3,
            ),
          ),
          const Spacer(),
          _MiniPill(label: 'Mảnh', color: const Color(0xFF5856D6)),
          const SizedBox(width: 6),
          _MiniPill(label: 'Bánh xe', color: const Color(0xFFFF2D55)),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final dynamic icon; // IconData
  final VoidCallback onTap;
  const _IconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: Colors.white.withOpacity(0.05),
        ),
        child: Icon(icon, size: 18, color: Colors.white54),
      ),
    );
  }
}

class _MiniPill extends StatelessWidget {
  final String label;
  final Color color;
  const _MiniPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      height: 30,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: Colors.white.withOpacity(0.05),
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: color),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// GOOEY GLOW LAYER — liquid blobs behind avatar circles
// ══════════════════════════════════════════════════════════════════════════════

class _GooeyLayer extends StatelessWidget {
  final int itemCount;
  final double scrollFraction;
  final double itemExtent;

  const _GooeyLayer({
    required this.itemCount,
    required this.scrollFraction,
    required this.itemExtent,
  });

  @override
  Widget build(BuildContext context) {
    // Approximate Y positions of each item relative to wheel center
    // The wheel's 3D transform wraps items on a cylinder; we approximate
    // linear Y for the glow layer.
    final centerY = MediaQuery.of(context).size.height / 2 - 60; // safe area offset

    return RepaintBoundary(
      child: ImageFiltered(
        imageFilter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Stack(
          children: List.generate(itemCount, (i) {
            final diff = i - scrollFraction;
            final distAbs = diff.abs();
            final opacity = (1 - distAbs * 0.25).clamp(0.0, 0.35);
            if (opacity <= 0) return const SizedBox.shrink();

            final scale = (1 - distAbs * 0.08).clamp(0.3, 1.0);
            final yPos = diff * itemExtent * 0.9; // approximate wheel Y
            final color = moodColor(sampleMemories[i].moodEmoji);

            return Positioned(
              left: 60,
              top: centerY + yPos - 35 * scale,
              child: Transform.scale(
                scale: scale,
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withOpacity(opacity),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DROP CARD — animated per-item widget with 3D transform + pill layout
// ══════════════════════════════════════════════════════════════════════════════

class _DropCard extends StatelessWidget {
  final double diff;        // distance from center (item - scrollFraction)
  final MemoryDatum memory;
  final bool isMoving;
  final VoidCallback onPlay;
  final double avatarSize;
  final double pillWidth;
  final double pillHeight;

  const _DropCard({
    required this.diff,
    required this.memory,
    required this.isMoving,
    required this.onPlay,
    required this.avatarSize,
    required this.pillWidth,
    required this.pillHeight,
  });

  @override
  Widget build(BuildContext context) {
    final distAbs = diff.abs();
    final isActive = distAbs < 0.35; // close enough to center
    final isSettled = !isMoving && isActive;

    // ─── Spec B: Scale & Opacity ───
    final scale = (1 - distAbs * 0.05).clamp(0.75, 1.0);
    final opacity = (1 - distAbs * 0.18).clamp(0.15, 1.0);

    // ─── Spec C: Quỹ đạo cong (arc translation) ───
    final xOffset = math.pow(distAbs, 1.5) * 12;

    // ─── Spec D: Nghiêng 3D ───
    // diff > 0 (below center) → tilt forward (positive)
    // diff < 0 (above center) → tilt backward (negative)
    final tiltRad = diff * 0.15;

    final color = moodColor(memory.moodEmoji);

    return Opacity(
      opacity: opacity,
      child: Transform(
        alignment: Alignment.center,
        transform: Matrix4.identity()
          ..setEntry(3, 2, 0.001) // perspective
          ..translate(xOffset, 0.0, 0.0)
          ..rotateX(tiltRad)
          ..scale(scale),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SizedBox(
            height: avatarSize,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // ── Pill body ──
                Positioned(
                  left: 0,
                  top: (avatarSize - pillHeight) / 2,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 350),
                    curve: Curves.easeOutCubic,
                    width: pillWidth,
                    height: pillHeight,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(pillHeight / 2),
                      color: !isMoving
                          ? Colors.white.withOpacity(0.05)
                          : Colors.transparent,
                      border: !isMoving
                          ? Border.all(color: color.withOpacity(0.33), width: 1.5)
                          : Border.all(color: Colors.transparent, width: 1.5),
                      boxShadow: !isMoving
                          ? [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.35),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : null,
                    ),
                  ),
                ),

                // ── Title + date ──
                Positioned(
                  left: 10,
                  top: (avatarSize - pillHeight) / 2 + 6,
                  child: SizedBox(
                    width: pillWidth - 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          memory.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white.withOpacity(0.6 + opacity * 0.3),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          relativeTime(memory.date),
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withOpacity(0.2 + opacity * 0.2),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Play button (only when settled + active) ──
                if (isSettled)
                  Positioned(
                    right: -6,
                    top: (avatarSize - 24) / 2,
                    child: GestureDetector(
                      onTap: onPlay,
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [color, color.withOpacity(0.73)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(LucideIcons.play,
                            size: 10,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),

                // ── Avatar circle ──
                Positioned(
                  left: -avatarSize * 0.4,
                  top: 0,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 350),
                    curve: Curves.easeOutCubic,
                    width: avatarSize,
                    height: avatarSize,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: color.withOpacity(0.8),
                      boxShadow: isSettled
                          ? [
                              BoxShadow(
                                color: color.withOpacity(0.27),
                                blurRadius: 16,
                              ),
                              BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        memory.moodEmoji ?? '🧠',
                        style: const TextStyle(fontSize: 36),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DOT PAGINATION
// ══════════════════════════════════════════════════════════════════════════════

class _DotBar extends StatelessWidget {
  final List<MemoryDatum> memories;
  final int centerIndex;
  final ValueChanged<int> onTap;

  const _DotBar({
    required this.memories,
    required this.centerIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const range = 3;
    final start = (centerIndex - range).clamp(0, memories.length - 1);
    final end = (centerIndex + range).clamp(0, memories.length - 1);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(end - start + 1, (i) {
          final idx = start + i;
          final isActive = idx == centerIndex;
          final color = moodColor(memories[idx].moodEmoji);

          return GestureDetector(
            onTap: () => onTap(idx),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: isActive ? 24 : 5,
              height: 5,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(isActive ? 3 : 999),
                color: isActive ? color : Colors.white.withOpacity(0.12),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL BOTTOM SHEET
// ══════════════════════════════════════════════════════════════════════════════

class _DetailSheet extends StatelessWidget {
  final MemoryDatum memory;
  final VoidCallback onClose;

  const _DetailSheet({required this.memory, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final color = moodColor(memory.moodEmoji);

    return Stack(
      children: [
        // Scrim
        GestureDetector(
          onTap: onClose,
          child: Container(color: Colors.black.withOpacity(0.6)),
        ),
        // Sheet
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.85,
            ),
            decoration: const BoxDecoration(
              color: Color(0xFF1C1C1E),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black38,
                  blurRadius: 40,
                  offset: Offset(0, -8),
                ),
              ],
            ),
            child: IntrinsicHeight(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                // Handle
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Header row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        'CHI TIẾT KÝ ỨC',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.white.withOpacity(0.3),
                          letterSpacing: 1.2,
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: onClose,
                        child: Icon(LucideIcons.x,
                          size: 16,
                          color: Colors.white.withOpacity(0.4),
                        ),
                      ),
                    ],
                  ),
                ),
                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Mood + Title row
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                color: color.withOpacity(0.09),
                                border: Border.all(color: color.withOpacity(0.21)),
                              ),
                              child: Center(
                                child: Text(
                                  memory.moodEmoji ?? '🧠',
                                  style: const TextStyle(fontSize: 24),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    relativeTime(memory.date).toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: color,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    memory.title,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                      letterSpacing: -0.3,
                                      height: 1.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (memory.content != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.white.withOpacity(0.04)),
                            ),
                            child: Text(
                              memory.content!,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withOpacity(0.6),
                                height: 1.5,
                              ),
                            ),
                          ),
                        ],
                        if (memory.imageUrl != null) ...[
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Image.network(
                              memory.imageUrl!,
                              height: 200,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
