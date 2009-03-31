module Poker
  class Deck < Array
    
    def initialize(*cards)
      if cards.empty?
        new_deck(52)
      elsif cards.first.class == Fixnum
        new_deck(cards.first)
      else
        cards.each { |c| self << c }
      end
    end
    
    def sort
      cards = []
      ids.sort.each { |id| cards << Card.new(id) }
      Deck.new(*cards)
    end
    
    def sort!
      tmp = sort
      self.clear
      tmp.each { |c| self << c }
      self
    end
    
    def shuffle
      cards = []
      ids.shuffle.each { |id| cards << Card.new(id) }
      Deck.new(*cards)
    end
    
    def shuffle!
      tmp = shuffle
      self.clear
      tmp.each { |c| self << c }
      self
    end
    
    def deal(number_of_hands, hand_size = 5)
      hands = {}
      
      hand_size.times do
        number_of_hands.times do |i|
          hands[i] ||= Hand.new
          hands[i] << self.shift
        end
      end
      
      hands.values.sort
    end
    
    def ids
      self.map { |c| c.id }.sort
    end

    def numbers
      self.map { |c| c.number }.sort
    end

    def suits
      self.map { |c| c.suit }.sort
    end
    
    private
    def new_deck(size)
      size.times { |i| self << Card.new(i) }
      self.shuffle!
    end
  end
end
