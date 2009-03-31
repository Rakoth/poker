module Poker
  class Hand < Deck
    include Comparable
    
    # Poker::Hand.new
    # Poker::Hand.new(Poker::Card.new("2C"), Poker::Card.new("2D"))
    # Poker::Hand.new([Poker::Card.new("2C"), Poker::Card.new("2D")])
    # Poker::Hand.new("2C 2D")
    # Poker::Hand.new("2C", "2D")
    # Poker::Hand.new(["2C", "2D"])
    def initialize(*args)
      args.flatten.each do |c|
      
        if c.class == String
          c.split(" ").each do |card|
            self << Card.new(card)
          end
        else
          self << Card.new(c)
        end
        
      end
    end
    
    def rank
      Ranks[rank_number].to_s.gsub("_", " ").capitalize
    end
    
    def rank_number
      Ranks.sort.reverse.each { |rank, symbol| return rank if self.send("#{symbol}?") }
      0
    end
    
    def <=>(other_hand)
      if rank_number < other_hand.rank_number
        return -1
      elsif rank_number > other_hand.rank_number
        return 1
      else
        return 0
      end
    end
    
    def royal_flush?
      self.sort[0].number == 10 and straight_flush?
    end

    def straight_flush?
      flush? and straight?
    end

    def four_of_a_kind?
      pairs(4).size == 1
    end

    def full_house?
      pairs(3).size == 1 and pairs(2).size == 1
    end

    def flush?
      suits.uniq.size == 1
    end

    def straight?
      numbers.sequence?
    end

    def pair?
      pairs(2).size == 1
    end

    def two_pairs?
      pairs(2).size == 2
    end

    def three_of_a_kind?
      pairs(3).size == 1
    end

    def cards
      self.join(" ")
    end

    def to_s
      cards + " (" + rank + ")"
    end

    def inspect
      to_s
    end
    
    private
    def pairs(pair_size)
      pairs = []
      numbers.map do |number|
        next if pairs.include?(number)
        if numbers.select { |x| x == number }.size == pair_size
          pairs << number
        end
      end
      pairs
    end
    
  end
end

